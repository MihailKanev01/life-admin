package com.lifeadmin.api.search;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService search;

    public SearchController(SearchService search) {
        this.search = search;
    }

    @GetMapping
    public SearchDtos.SearchResponse search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("q") String query) {
        return new SearchDtos.SearchResponse(search.search(principal, query));
    }
}
