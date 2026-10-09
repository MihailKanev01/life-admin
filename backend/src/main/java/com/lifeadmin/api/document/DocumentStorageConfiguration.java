package com.lifeadmin.api.document;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;

@Configuration @Profile("!test")
public class DocumentStorageConfiguration {
    @Bean(destroyMethod="close")
    S3Client documentS3Client(
        @Value("${life-admin.storage.s3.endpoint:}") String endpoint,
        @Value("${life-admin.storage.s3.region:eu-central-1}") String region,
        @Value("${life-admin.storage.s3.access-key:}") String accessKey,
        @Value("${life-admin.storage.s3.secret-key:}") String secretKey,
        @Value("${life-admin.storage.s3.path-style-access:false}") boolean pathStyle) {
        var builder=S3Client.builder().region(Region.of(region))
            .credentialsProvider(credentials(accessKey,secretKey))
            .httpClientBuilder(UrlConnectionHttpClient.builder())
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyle).build());
        if(endpoint!=null&&!endpoint.isBlank())builder.endpointOverride(URI.create(endpoint));
        return builder.build();
    }
    @Bean(destroyMethod="close")
    S3Presigner documentS3Presigner(
        @Value("${life-admin.storage.s3.endpoint:}") String endpoint,
        @Value("${life-admin.storage.s3.region:eu-central-1}") String region,
        @Value("${life-admin.storage.s3.access-key:}") String accessKey,
        @Value("${life-admin.storage.s3.secret-key:}") String secretKey,
        @Value("${life-admin.storage.s3.path-style-access:false}") boolean pathStyle) {
        var builder=S3Presigner.builder().region(Region.of(region))
            .credentialsProvider(credentials(accessKey,secretKey))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyle).build());
        if(endpoint!=null&&!endpoint.isBlank())builder.endpointOverride(URI.create(endpoint));
        return builder.build();
    }
    private static AwsCredentialsProvider credentials(String accessKey,String secretKey) {
        boolean hasKey=accessKey!=null&&!accessKey.isBlank(),hasSecret=secretKey!=null&&!secretKey.isBlank();
        if(hasKey!=hasSecret)throw new IllegalStateException("Both S3 access key and secret key must be configured together.");
        return hasKey?StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey,secretKey)):DefaultCredentialsProvider.create();
    }
}
