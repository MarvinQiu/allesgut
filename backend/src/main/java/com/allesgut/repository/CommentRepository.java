package com.allesgut.repository;

import com.allesgut.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostIdOrderByCreatedAtAsc(UUID postId, Pageable pageable);
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(UUID postId);
    List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);
    long countByPostId(UUID postId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
}
