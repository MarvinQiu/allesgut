package com.allesgut.repository;

import com.allesgut.entity.CommentMention;
import com.allesgut.entity.CommentMentionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentMentionRepository extends JpaRepository<CommentMention, CommentMentionId> {
    List<CommentMention> findByCommentId(UUID commentId);
    List<CommentMention> findByUserId(UUID userId);
}
