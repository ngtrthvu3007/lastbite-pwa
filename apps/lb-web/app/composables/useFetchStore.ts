import { useQuery } from "@vue/apollo-composable";
import { MY_STORE_QUERY } from "~/api/store";
import type { MyStoreQuery } from "~/types/store";

export const useFetchStore = () => {
  // Always asks the API: the user may have just created the store, so a cached null would be stale.
  const { result, loading: isLoading, error, refetch } = useQuery<MyStoreQuery>(
    MY_STORE_QUERY,
    undefined,
    { fetchPolicy: "network-only" },
  );
  const store = computed(() => result.value?.myStore ?? null);

  return { store, isLoading, error, refetch };
};
