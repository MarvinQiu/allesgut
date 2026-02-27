package com.allesgut.repository;

import com.allesgut.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByUserIdInOrderByCreatedAtDesc(List<UUID> userIds, Pageable pageable);

    @Modifying
    @Query(value = "insert into post_tags (post_id, tag_id) values (:postId, :tagId)", nativeQuery = true)
    void savePostTag(@Param("postId") UUID postId, @Param("tagId") Long tagId);

    @Query(value = "select t.name from tags t join post_tags pt on pt.tag_id = t.id where pt.post_id = :postId order by t.name", nativeQuery = true)
    List<String> findTagNamesByPostId(@Param("postId") UUID postId);

    @Query(value = "select pt.post_id as postId, t.name as name " +
            "from post_tags pt join tags t on pt.tag_id = t.id " +
            "where pt.post_id in (:postIds) " +
            "order by pt.post_id, t.name", nativeQuery = true)
    List<PostTagNameProjection> findTagNamesByPostIds(@Param("postIds") List<UUID> postIds);

    interface PostTagNameProjection {
        UUID getPostId();

        String getName();
    }
}
