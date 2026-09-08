import { clearAccessToken, getAccessToken, setAccessToken } from "./auth";
import { gql } from "./gql";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function requestOtp(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const data = await gql<{
    requestOtp: { __typename: string; message: string };
  }>(
    /* GraphQL */ `
      mutation RequestOtp($email: String!) {
        requestOtp(email: $email) {
          __typename
          ... on RequestOtpSuccess {
            message
          }
          ... on OtpCooldownError {
            message
          }
        }
      }
    `,
    { email },
  );
  const result = data.requestOtp;
  if (result.__typename === "RequestOtpSuccess") return { ok: true };
  return { ok: false, message: result.message };
}

export type VerifyOtpResult =
  | { ok: true; accessToken: string; isNewUser: boolean }
  | { ok: false; message: string };

export async function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyOtpResult> {
  const data = await gql<{
    verifyOtp: {
      __typename: string;
      accessToken?: string;
      isNewUser?: boolean;
      message?: string;
    };
  }>(
    /* GraphQL */ `
      mutation VerifyOtp($email: String!, $code: String!) {
        verifyOtp(email: $email, code: $code) {
          __typename
          ... on VerifyOtpSuccess {
            accessToken
            isNewUser
          }
          ... on OtpInvalidError {
            message
          }
          ... on OtpLockedError {
            message
          }
        }
      }
    `,
    { email, code },
  );
  const r = data.verifyOtp;
  if (r.__typename === "VerifyOtpSuccess") {
    return { ok: true, accessToken: r.accessToken!, isNewUser: r.isNewUser! };
  }
  return { ok: false, message: r.message ?? "Ошибка" };
}

export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch("/graphql/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { refreshToken { __typename ... on RefreshTokenSuccess { accessToken } } }`,
      }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const result = json?.data?.refreshToken;
    if (result?.__typename === "RefreshTokenSuccess") {
      setAccessToken(result.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await gql(/* GraphQL */ `
    mutation Logout {
      logout
    }
  `);
  clearAccessToken();
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  fileUrl: string;
  mediaType: string;
  width: number | null;
  height: number | null;
  order: number;
}

export interface Post {
  id: string;
  caption: string;
  location: string;
  createdAt: string;
  author: { id: string; email: string; displayName: string };
  mediaItems: MediaItem[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; displayName: string };
  replies: Comment[];
}

export interface CommentsPage {
  items: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedPage {
  items: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchFeed(cursor?: string): Promise<FeedPage> {
  const data = await gql<{ feed: FeedPage }>(
    /* GraphQL */ `
      query Feed($cursor: String, $limit: Int) {
        feed(cursor: $cursor, limit: $limit) {
          items {
            id
            caption
            location
            createdAt
            author {
              id
              displayName
            }
            mediaItems {
              id
              fileUrl
              mediaType
              width
              height
              order
            }
            likesCount
            commentsCount
            isLiked
            isSaved
          }
          nextCursor
          hasMore
        }
      }
    `,
    { cursor: cursor ?? null, limit: 20 },
  );
  return data.feed;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Me {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  followersCount: number;
  followingCount: number;
}

export async function fetchMe(): Promise<Me> {
  const data = await gql<{ me: Me }>(/* GraphQL */ `
    query Me {
      me {
        id
        email
        displayName
        avatarUrl
        followersCount
        followingCount
      }
    }
  `);
  return data.me;
}

export async function fetchMyPosts(cursor?: string): Promise<FeedPage> {
  const data = await gql<{ myPosts: FeedPage }>(
    /* GraphQL */ `
      query MyPosts($cursor: String, $limit: Int) {
        myPosts(cursor: $cursor, limit: $limit) {
          items {
            id
            caption
            mediaItems {
              id
              fileUrl
              mediaType
              order
            }
          }
          nextCursor
          hasMore
        }
      }
    `,
    { cursor: cursor ?? null, limit: 30 },
  );
  return data.myPosts;
}

export async function updateProfile(params: {
  displayName?: string;
  avatar?: File;
}): Promise<Me> {
  // multipart нужен только если есть файл
  if (params.avatar) {
    const map: Record<string, string[]> = { "0": ["variables.avatar"] };
    const ops = JSON.stringify({
      query: `
        mutation UpdateProfile($displayName: String, $avatar: Upload) {
          updateProfile(displayName: $displayName, avatar: $avatar) {
            id email displayName avatarUrl
          }
        }
      `,
      variables: { displayName: params.displayName ?? null, avatar: null },
    });
    const form = new FormData();
    form.append("operations", ops);
    form.append("map", JSON.stringify(map));
    form.append("0", params.avatar);

    const token = (await import("./auth")).getAccessToken();
    const res = await fetch(`${window.location.origin}/graphql/`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    return json.data.updateProfile as Me;
  }

  const data = await gql<{ updateProfile: Me }>(
    /* GraphQL */ `
      mutation UpdateProfile($displayName: String) {
        updateProfile(displayName: $displayName) {
          id
          email
          displayName
          avatarUrl
        }
      }
    `,
    { displayName: params.displayName ?? null },
  );
  return data.updateProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export async function fetchUserProfile(
  id: string,
): Promise<UserProfile | null> {
  const data = await gql<{ userProfile: UserProfile | null }>(
    /* GraphQL */ `
      query UserProfile($id: ID!) {
        userProfile(id: $id) {
          id
          email
          displayName
          avatarUrl
          isFollowing
          followersCount
          followingCount
        }
      }
    `,
    { id },
  );
  return data.userProfile;
}

export async function fetchUserPosts(
  userId: string,
  cursor?: string,
): Promise<FeedPage> {
  const data = await gql<{ userPosts: FeedPage }>(
    /* GraphQL */ `
      query UserPosts($userId: ID!, $cursor: String, $limit: Int) {
        userPosts(userId: $userId, cursor: $cursor, limit: $limit) {
          items {
            id
            caption
            mediaItems {
              id
              fileUrl
              mediaType
              order
            }
          }
          nextCursor
          hasMore
        }
      }
    `,
    { userId, cursor: cursor ?? null, limit: 30 },
  );
  return data.userPosts;
}

export async function createPost(params: {
  caption: string;
  location: string;
  files: File[];
}): Promise<void> {
  const operations = JSON.stringify({
    query: `
      mutation CreatePost($caption: String!, $location: String!, $files: [Upload!]) {
        createPost(caption: $caption, location: $location, files: $files) { id }
      }
    `,
    variables: {
      caption: params.caption,
      location: params.location,
      files: params.files.map(() => null),
    },
  });

  const map: Record<string, string[]> = {};
  params.files.forEach((_, i) => {
    map[String(i)] = [`variables.files.${i}`];
  });

  const fd = new FormData();
  fd.append("operations", operations);
  fd.append("map", JSON.stringify(map));
  params.files.forEach((file, i) => fd.append(String(i), file));

  const token = getAccessToken();
  const res = await fetch(`${window.location.origin}/graphql/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
}

export async function followUser(userId: string): Promise<boolean> {
  const data = await gql<{ followUser: boolean }>(
    /* GraphQL */ `
      mutation FollowUser($userId: ID!) {
        followUser(userId: $userId)
      }
    `,
    { userId },
  );
  return data.followUser;
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const data = await gql<{ unfollowUser: boolean }>(
    /* GraphQL */ `
      mutation UnfollowUser($userId: ID!) {
        unfollowUser(userId: $userId)
      }
    `,
    { userId },
  );
  return data.unfollowUser;
}

export interface FollowUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export async function fetchFollowers(userId: string): Promise<FollowUser[]> {
  const data = await gql<{ followers: FollowUser[] }>(
    /* GraphQL */ `
      query Followers($userId: ID!) {
        followers(userId: $userId) {
          id
          displayName
          email
          avatarUrl
        }
      }
    `,
    { userId },
  );
  return data.followers;
}

export async function fetchFollowing(userId: string): Promise<FollowUser[]> {
  const data = await gql<{ following: FollowUser[] }>(
    /* GraphQL */ `
      query Following($userId: ID!) {
        following(userId: $userId) {
          id
          displayName
          email
          avatarUrl
        }
      }
    `,
    { userId },
  );
  return data.following;
}

export async function fetchGuestFeed(cursor?: string): Promise<FeedPage> {
  // Без токена — сырой fetch, не через gql()
  const res = await fetch(`${window.location.origin}/graphql/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query GuestFeed($cursor: String, $limit: Int) {
          guestFeed(cursor: $cursor, limit: $limit) {
            items {
              id
              caption
              location
              createdAt
              author {
                id
                displayName
              }
              mediaItems {
                id
                fileUrl
                mediaType
                width
                height
                order
              }
              likesCount
              commentsCount
              isLiked
              isSaved
            }
            nextCursor
            hasMore
          }
        }
      `,
      variables: { cursor: cursor ?? null, limit: 20 },
    }),
  });
  const json = await res.json();
  return json.data.guestFeed as FeedPage;
}

// ─── Posts interactions ──────────────────────────────────────────────────────

export async function likePost(postId: string): Promise<boolean> {
  const data = await gql<{ likePost: boolean }>(
    /* GraphQL */ `
      mutation LikePost($postId: ID!) {
        likePost(postId: $postId)
      }
    `,
    { postId },
  );
  return data.likePost;
}

export async function unlikePost(postId: string): Promise<boolean> {
  const data = await gql<{ unlikePost: boolean }>(
    /* GraphQL */ `
      mutation UnlikePost($postId: ID!) {
        unlikePost(postId: $postId)
      }
    `,
    { postId },
  );
  return data.unlikePost;
}

export async function savePost(postId: string): Promise<boolean> {
  const data = await gql<{ savePost: boolean }>(
    /* GraphQL */ `
      mutation SavePost($postId: ID!) {
        savePost(postId: $postId)
      }
    `,
    { postId },
  );
  return data.savePost;
}

export async function unsavePost(postId: string): Promise<boolean> {
  const data = await gql<{ unsavePost: boolean }>(
    /* GraphQL */ `
      mutation UnsavePost($postId: ID!) {
        unsavePost(postId: $postId)
      }
    `,
    { postId },
  );
  return data.unsavePost;
}

export async function addComment(
  postId: string,
  text: string,
  parentId?: string,
): Promise<Comment> {
  const data = await gql<{ addComment: Comment }>(
    /* GraphQL */ `
      mutation AddComment($postId: ID!, $text: String!, $parentId: ID) {
        addComment(postId: $postId, text: $text, parentId: $parentId) {
          id
          text
          createdAt
          author {
            id
            displayName
          }
          replies {
            id
            text
            createdAt
            author {
              id
              displayName
            }
            replies {
              id
            }
          }
        }
      }
    `,
    { postId, text, parentId: parentId ?? null },
  );
  return data.addComment;
}

export async function fetchPostComments(
  postId: string,
  cursor?: string,
): Promise<CommentsPage> {
  const res = await fetch(`${window.location.origin}/graphql/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query PostComments($postId: ID!, $cursor: String, $limit: Int) {
          postComments(postId: $postId, cursor: $cursor, limit: $limit) {
            items {
              id
              text
              createdAt
              author {
                id
                displayName
              }
              replies {
                id
                text
                createdAt
                author {
                  id
                  displayName
                }
                replies {
                  id
                }
              }
            }
            nextCursor
            hasMore
          }
        }
      `,
      variables: { postId, cursor: cursor ?? null, limit: 10 },
    }),
  });
  const json = await res.json();
  return json.data.postComments as CommentsPage;
}
