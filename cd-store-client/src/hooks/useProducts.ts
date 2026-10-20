
import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  type ProductQueryParams,
} from "../services/productServices";

const API_URL = import.meta.env.VITE_API_URL;

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: Required<ProductQueryParams>) =>
    [...productKeys.lists(), params] as const,
  newReleases: () => [...productKeys.all, "new-releases"] as const,
  mediaTypes: () => ["media-types"] as const,
};

export type MediaType = {
  id: string;
  name: string;
  created_at: string;
};

export function useProducts(
  params: ProductQueryParams = {},
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const search = params.search ?? "";
  const mediaType = params.mediaType ?? "ALL";

  return useQuery({
    queryKey: productKeys.list({
      page,
      limit,
      search,
      mediaType,
    }),
    queryFn: () =>
      getProducts({ page, limit, search, mediaType }),
  });
}

export function useNewReleases() {
  return useQuery({
    queryKey: productKeys.newReleases(),
    queryFn: () => getProducts({ page: 1, limit: 4 }),
  });
}

export function useMediaTypes() {
  return useQuery({
    queryKey: productKeys.mediaTypes(),
    queryFn: async (): Promise<MediaType[]> => {
      if (!API_URL) {
        throw new Error("VITE_API_URL is not configured.");
      }

      const response = await fetch(`${API_URL}/media-types`);
      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load media types.");
      }

      const list: unknown[] = Array.isArray(result)
        ? result
        : result &&
            typeof result === "object" &&
            "data" in result &&
            Array.isArray(result.data)
          ? result.data
          : result &&
              typeof result === "object" &&
              "mediaTypes" in result &&
              Array.isArray(result.mediaTypes)
            ? result.mediaTypes
            : [];

      return list.filter(
        (item): item is MediaType =>
          !!item &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string" &&
          "name" in item &&
          typeof item.name === "string",
      );
    },
  });
}
