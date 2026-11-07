import { gql } from '@apollo/client/core'

export const CREATE_POST_IMAGE_UPLOAD_MUTATION = gql`
  mutation CreatePostImageUpload($input: CreatePostImageUploadInput!) {
    createPostImageUpload(input: $input) {
      assetId
      uploadUrl
      fields { name value }
      expiresAt
    }
  }
`

export const COMPLETE_POST_IMAGE_UPLOAD_MUTATION = gql`
  mutation CompletePostImageUpload($assetId: ID!) {
    completePostImageUpload(assetId: $assetId) {
      id
    }
  }
`

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
    }
  }
`

export const ACTIVE_POSTS_QUERY = gql`
  query ActivePosts($limit: Int) {
    activePosts(limit: $limit) {
      id
      imageUrl
      title
      currentPrice
      remainingQuantity
      pickupEndAt
      storeName
    }
  }
`

export const POST_QUERY = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      imageUrl
      title
      description
      originalPrice
      currentPrice
      remainingQuantity
      pickupStartAt
      pickupEndAt
      expiresAt
      storeName
      phone
      address
    }
  }
`
