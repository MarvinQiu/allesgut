package com.allesgut.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserBuilderDefaultsTests {

    @Test
    void builderShouldDefaultCountFieldsToZero() {
        User user = User.builder()
                .phone("13800138000")
                .nickname("Test")
                .build();

        assertEquals(0, user.getPostsCount());
        assertEquals(0, user.getFollowersCount());
        assertEquals(0, user.getFollowingCount());
    }
}
