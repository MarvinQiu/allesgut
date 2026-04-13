import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from '../../components/PostCard';

const fullPost = {
  id: 'p1',
  title: '感统训练技巧',
  content: '训练方法分享',
  author: '小雨妈妈',
  avatar: 'https://example.com/avatar.png',
  image: 'https://example.com/cover.png',
  images: [
    'https://example.com/cover.png',
    'https://example.com/img2.png',
  ],
  tags: ['感统训练', '自闭症', '日常护理'],
  likes: 128,
  comments: 23,
  time: '2小时前',
};

describe('PostCard', () => {
  test('renders title, author, likes, comments, and time', () => {
    render(<PostCard post={fullPost} />);

    expect(screen.getByText('感统训练技巧')).toBeInTheDocument();
    expect(screen.getByText('小雨妈妈')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('2小时前')).toBeInTheDocument();
  });

  test('renders image when post has an image', () => {
    render(<PostCard post={fullPost} />);

    const img = screen.getByAltText('感统训练技巧');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/cover.png');
  });

  test('shows multi-image badge when post has multiple images', () => {
    render(<PostCard post={fullPost} />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  test('does not render image section when post has no image', () => {
    const noImagePost = { ...fullPost, image: null, images: [] };
    render(<PostCard post={noImagePost} />);

    expect(screen.queryByAltText('感统训练技巧')).not.toBeInTheDocument();
  });

  test('renders at most 2 tags', () => {
    render(<PostCard post={fullPost} />);

    expect(screen.getByText('#感统训练')).toBeInTheDocument();
    expect(screen.getByText('#自闭症')).toBeInTheDocument();
    // Third tag should not be rendered
    expect(screen.queryByText('#日常护理')).not.toBeInTheDocument();
  });

  test('renders without tags when tags are empty', () => {
    const noTagsPost = { ...fullPost, tags: [] };
    render(<PostCard post={noTagsPost} />);

    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });

  test('calls onClick with post when clicked', () => {
    const handleClick = jest.fn();
    render(<PostCard post={fullPost} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(fullPost);
  });

  test('calls onClick on Enter key press', () => {
    const handleClick = jest.fn();
    render(<PostCard post={fullPost} onClick={handleClick} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(fullPost);
  });

  test('calls onClick on Space key press', () => {
    const handleClick = jest.fn();
    render(<PostCard post={fullPost} onClick={handleClick} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(fullPost);
  });

  test('does not call onClick on other key presses', () => {
    const handleClick = jest.fn();
    render(<PostCard post={fullPost} onClick={handleClick} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('has correct aria-label with title and author', () => {
    render(<PostCard post={fullPost} />);

    const article = screen.getByRole('button');
    expect(article).toHaveAttribute('aria-label', '感统训练技巧 - 作者: 小雨妈妈');
  });

  test('renders author avatar with correct alt text', () => {
    render(<PostCard post={fullPost} />);

    const avatar = screen.getByAltText('小雨妈妈的头像');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
  });
});
