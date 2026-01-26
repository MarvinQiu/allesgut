package com.allesgut.repository;

import com.allesgut.entity.PostFavorite;
import com.allesgut.entity.PostFavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostFavoriteRepository extends JpaRepository<PostFavorite, PostFavoriteId> {
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    void deleteByUserIdAndPostId(UUID userId, UUID postId);
}
