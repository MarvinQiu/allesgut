package com.allesgut.controller;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentsController {

    private final CommentService commentService;

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        CommentDto comment = commentService.createComment(postId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(comment));
    }

    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentDto>>> getCommentsByPost(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<CommentDto> comments = commentService.getCommentsByPost(
                postId, currentUserId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.deleteComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }

    @PostMapping("/api/comments/{id}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.likeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment liked"));
    }

    @DeleteMapping("/api/comments/{id}/like")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.unlikeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked"));
    }
}
