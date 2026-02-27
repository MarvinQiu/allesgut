package com.allesgut.repository;

import com.allesgut.entity.Post;
import com.allesgut.entity.Tag;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class PostTagsRepositoryTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TagRepository tagRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138001")
                .nickname("Tag Test User")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldLoadTagsForPostViaPostTagsJoinTable() {
        Post post = postRepository.save(Post.builder()
                .userId(testUser.getId())
                .title("Post with tags")
                .content("Content")
                .build());

        Tag tag1 = tagRepository.save(Tag.builder().name("tag-a").build());
        Tag tag2 = tagRepository.save(Tag.builder().name("tag-b").build());

        // Insert join rows (this should fail before migration creates post_tags)
        jdbcTemplate.update(
                "insert into post_tags (post_id, tag_id) values (?, ?)",
                post.getId(),
                tag1.getId()
        );
        jdbcTemplate.update(
                "insert into post_tags (post_id, tag_id) values (?, ?)",
                post.getId(),
                tag2.getId()
        );

        List<String> tagNames = jdbcTemplate.queryForList(
                "select t.name from tags t join post_tags pt on pt.tag_id = t.id where pt.post_id = ? order by t.name",
                String.class,
                post.getId()
        );

        assertThat(tagNames).containsExactly("tag-a", "tag-b");
    }
}
