import { gql } from "@apollo/client/core";

const STORE_FIELDS_FRAGMENT = gql`
  fragment StoreFields on Store {
    id
    name
    phone
    address
    createdAt
  }
`;

export const MY_STORE_QUERY = gql`
  ${STORE_FIELDS_FRAGMENT}
  query MyStore {
    myStore {
      ...StoreFields
    }
  }
`;

export const CREATE_STORE_MUTATION = gql`
  ${STORE_FIELDS_FRAGMENT}
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      ...StoreFields
    }
  }
`;
