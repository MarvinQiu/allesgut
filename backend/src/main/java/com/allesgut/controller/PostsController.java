package com.allesgut.controller;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.PostDto;
import com.allesgut.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostsController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        PostDto post = postService.createPost(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(post));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostDto>>> getFeed(
            @RequestParam(defaultValue = "recommended") String feedType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String tag,
            Authentication authentication) {

        UUID currentUserId = authentication != null && authentication.isAuthenticated()
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<PostDto> feed = postService.getFeed(feedType, currentUserId, page, limit, tag);
        return ResponseEntity.ok(ApiResponse.success(feed));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDto>> getPostById(
            @PathVariable UUID id,
            Authentication authentication) {

        UUID currentUserId = authentication != null && authentication.isAuthenticated()
                ? UUID.fromString(authentication.getName())
                : null;

        PostDto post = postService.getPostById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        postService.likePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post liked"));
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        postService.unlikePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post unliked"));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<Void>> favoritePost(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        postService.favoritePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post favorited"));
    }

    @DeleteMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<Void>> unfavoritePost(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        postService.unfavoritePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post unfavorited"));
    }
}
