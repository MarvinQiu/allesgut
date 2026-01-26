package com.allesgut.repository;

import com.allesgut.entity.UserFollow;
import com.allesgut.entity.UserFollowId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {
    List<UserFollow> findByFollowerId(UUID followerId);
    Page<UserFollow> findByFollowerId(UUID followerId, Pageable pageable);
    Page<UserFollow> findByFollowingId(UUID followingId, Pageable pageable);
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}
