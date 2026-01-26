package com.allesgut.controller;

import com.allesgut.dto.response.ApiResponse;
import com.allesgut.entity.Tag;
import com.allesgut.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagsController {

    private final TagRepository tagRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Tag>>> getTags(
            @RequestParam(defaultValue = "20") int limit) {

        List<Tag> tags = tagRepository.findAllByOrderByUsageCountDesc(
                PageRequest.of(0, limit)
        ).getContent();

        return ResponseEntity.ok(ApiResponse.success(tags));
    }
}
