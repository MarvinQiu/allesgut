package com.allesgut.repository;

import com.allesgut.entity.CommentLike;
import com.allesgut.entity.CommentLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {
    boolean existsByUserIdAndCommentId(UUID userId, UUID commentId);
    void deleteByUserIdAndCommentId(UUID userId, UUID commentId);
}
