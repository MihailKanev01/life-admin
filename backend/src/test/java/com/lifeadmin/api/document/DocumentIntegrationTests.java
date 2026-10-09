package com.lifeadmin.api.document;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void uploadFinalizeListDownloadAndDeleteWorkEndToEnd() throws Exception {
        MockHttpSession owner=register(email("document-owner"),"Document Owner");
        String thingId=createThing(owner,"Mazda 6");
        byte[] pdf="%PDF-1.7\nLife Admin document fixture\n".getBytes(StandardCharsets.UTF_8);
        String checksum=sha256(pdf);
        Upload upload=createUpload(owner,"insurance.pdf","application/pdf",pdf,checksum,thingId);

        URI target=URI.create(upload.uploadUrl());
        String token=queryParameter(target.getRawQuery(),"token");
        mockMvc.perform(put(target.getPath()).with(csrf()).session(owner).param("token",token)
                        .header("x-amz-checksum-sha256",checksum)
                        .contentType(MediaType.APPLICATION_PDF).content(pdf))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/documents/"+upload.documentId()+"/finalize")
                        .with(csrf()).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("insurance.pdf"))
                .andExpect(jsonPath("$.status").value("READY"))
                .andExpect(jsonPath("$.thingId").value(thingId))
                .andExpect(jsonPath("$.thingName").value("Mazda 6"));

        mockMvc.perform(get("/api/v1/documents").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].fileName").value("insurance.pdf"));

        mockMvc.perform(get("/api/v1/documents").param("thingId",thingId).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        MvcResult signed=mockMvc.perform(get("/api/v1/documents/"+upload.documentId()+"/download-url").session(owner))
                .andExpect(status().isOk()).andReturn();
        JsonNode signedJson=objectMapper.readTree(signed.getResponse().getContentAsString());
        URI download=URI.create(signedJson.get("url").asText());
        mockMvc.perform(get(download.getPath()).param("token",queryParameter(download.getRawQuery(),"token")).session(owner))
                .andExpect(status().isOk())
                .andExpect(result->assertArrayEquals(pdf,result.getResponse().getContentAsByteArray()));

        mockMvc.perform(delete("/api/v1/documents/"+upload.documentId()).with(csrf()).session(owner))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/documents").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void documentsArePrivateAndThingLinksMustBelongToTheOwner() throws Exception {
        MockHttpSession owner=register(email("document-private-owner"),"Owner");
        MockHttpSession other=register(email("document-private-other"),"Other");
        String thingId=createThing(owner,"Private thing");
        byte[] pdf="%PDF-1.7\nprivate file\n".getBytes(StandardCharsets.UTF_8);
        Upload upload=createUpload(owner,"private.pdf","application/pdf",pdf,sha256(pdf),thingId);

        mockMvc.perform(get("/api/v1/documents").session(other))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(post("/api/v1/documents/"+upload.documentId()+"/finalize").with(csrf()).session(other))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/documents/"+upload.documentId()+"/download-url").session(other))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/documents/"+upload.documentId()).with(csrf()).session(other))
                .andExpect(status().isNotFound());

        MvcResult wrongThing=mockMvc.perform(post("/api/v1/documents/upload-sessions").with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadRequest("stolen.pdf","application/pdf",pdf,sha256(pdf),thingId)))
                .andExpect(status().isNotFound()).andReturn();
        assertNotNull(wrongThing);
    }

    @Test
    void rejectsUnsupportedTypesAndFilesWhoseSignatureDoesNotMatchTheirMimeType() throws Exception {
        MockHttpSession owner=register(email("document-validation"),"Validation Owner");
        byte[] executable="this is not a PDF document".getBytes(StandardCharsets.UTF_8);
        mockMvc.perform(post("/api/v1/documents/upload-sessions").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadRequest("payload.exe","application/pdf",executable,sha256(executable),null)))
                .andExpect(status().isBadRequest());

        Upload upload=createUpload(owner,"broken.pdf","application/pdf",executable,sha256(executable),null);
        URI target=URI.create(upload.uploadUrl());
        String token=queryParameter(target.getRawQuery(),"token");
        mockMvc.perform(put(target.getPath()).with(csrf()).session(owner).param("token",token)
                        .header("x-amz-checksum-sha256",sha256(executable))
                        .contentType(MediaType.APPLICATION_PDF).content(executable))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/documents/"+upload.documentId()+"/finalize").with(csrf()).session(owner))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/documents").session(owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
    }

    private Upload createUpload(MockHttpSession session,String name,String type,byte[] bytes,String checksum,String thingId) throws Exception {
        MvcResult result=mockMvc.perform(post("/api/v1/documents/upload-sessions").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadRequest(name,type,bytes,checksum,thingId)))
                .andExpect(status().isOk()).andReturn();
        JsonNode body=objectMapper.readTree(result.getResponse().getContentAsString());
        return new Upload(body.get("documentId").asText(),body.get("uploadUrl").asText());
    }

    private String createThing(MockHttpSession session,String name) throws Exception {
        MvcResult result=mockMvc.perform(post("/api/v1/things").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"%s","type":"Vehicle","detail":"integration test"}
                            """.formatted(name)))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String uploadRequest(String name,String type,byte[] bytes,String checksum,String thingId) {
        String thing=thingId==null?"":",\"thingId\":\""+thingId+"\"";
        return """
            {"fileName":"%s","contentType":"%s","sizeBytes":%d,"checksumSha256":"%s"%s}
            """.formatted(name,type,bytes.length,checksum,thing);
    }

    private MockHttpSession register(String email,String name) throws Exception {
        MvcResult result=mockMvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"%s","password":"LifeAdmin-Test-2026!","displayName":"%s","timezone":"Europe/Sofia"}
                            """.formatted(email,name)))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession)result.getRequest().getSession(false);
    }

    private static String email(String prefix){return prefix+"-"+UUID.randomUUID()+"@example.com";}
    private static String sha256(byte[] bytes) throws Exception {
        return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    private static String queryParameter(String query,String name) {
        for(String part:query.split("&")) {
            String[] pair=part.split("=",2);
            if(pair.length==2&&pair[0].equals(name))return pair[1];
        }
        throw new IllegalArgumentException("Missing query parameter "+name);
    }
    private record Upload(String documentId,String uploadUrl) {}
}
