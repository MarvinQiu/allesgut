package com.allesgut.repository;

import com.allesgut.entity.Comment;
import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Transactional
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CommentRepositoryTests {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);

        testPost = Post.builder()
                .userId(testUser.getId())
                .title("Test Post")
                .content("Test Content")
                .build();
        testPost = postRepository.save(testPost);
    }

    @Test
    void shouldSaveAndFindComment() {
        // Given
        Comment comment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Test Comment")
                .build();

        // When
        Comment savedComment = commentRepository.save(comment);
        Optional<Comment> foundComment = commentRepository.findById(savedComment.getId());

        // Then
        assertThat(foundComment).isPresent();
        assertThat(foundComment.get().getContent()).isEqualTo("Test Comment");
        assertThat(foundComment.get().getPostId()).isEqualTo(testPost.getId());
    }

    @Test
    void shouldFindCommentsByPostId() {
        // Given
        Comment comment1 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 1")
                .build();
        Comment comment2 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 2")
                .build();

        commentRepository.save(comment1);
        commentRepository.save(comment2);

        // When
        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(
                testPost.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(comments.getContent()).hasSize(2);
        assertThat(comments.getContent().get(0).getContent()).isEqualTo("Comment 1");
    }

    @Test
    void shouldFindCommentsByParentId() {
        // Given
        Comment parentComment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Parent Comment")
                .build();
        parentComment = commentRepository.save(parentComment);

        Comment replyComment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .parentId(parentComment.getId())
                .content("Reply Comment")
                .build();
        commentRepository.save(replyComment);

        // When
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(parentComment.getId());

        // Then
        assertThat(replies).hasSize(1);
        assertThat(replies.get(0).getContent()).isEqualTo("Reply Comment");
    }

    @Test
    void shouldCountCommentsByPostId() {
        // Given
        Comment comment1 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 1")
                .build();
        Comment comment2 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 2")
                .build();

        commentRepository.save(comment1);
        commentRepository.save(comment2);

        // When
        long count = commentRepository.countByPostId(testPost.getId());

        // Then
        assertThat(count).isEqualTo(2);
    }
}
