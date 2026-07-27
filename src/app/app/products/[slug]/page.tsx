// src/app/products/[slug]/page.tsx
import SingleProduct from "@/components/SingleProduct";
import RelatedProducts from "@/components/RelatedProducts";
import ProductLoader from "@/components/loader/ProductLoader";
import fetchData from "@/lib/fetchDataFromApi";
import { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import { BaseProduct } from "@/types/product";

type SingleProductPageProps = {
  params: { slug?: string };
};

// ================= METADATA =================
export async function generateMetadata(
  { params }: SingleProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params?.slug;
  if (!slug) {
    return { title: "Product", description: "" };
  }

  try {
    const res = await fetchData.get(`/singleProduct/${slug}`);
    const product: BaseProduct | null = res.data || null;

    return {
      title: product?.title || "Product Not Found",
      description: product?.description || "",
    };
  } catch {
    return { title: "Product Not Found", description: "" };
  }
}

// ================= PAGE =================
const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const slug = params?.slug;

  if (!slug) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-3xl font-semibold text-center">
        Product Not Found
      </div>
    );
  }

  try {
    const res = await fetchData.get(`/singleProduct/${slug}`);
    const product: BaseProduct | null = res.data || null;

    if (!product) {
      return (
        <div className="h-screen w-full flex justify-center items-center text-3xl font-semibold text-center">
          Product Not Found
        </div>
      );
    }

    console.log("📦 [SingleProductPage] product:", product);

    return (
      <section className="single-product-page bg-secondary dark:bg-background">
        <SingleProduct product={product} />

        <Suspense fallback={<ProductLoader />}>
          {product.shop_category && Array.isArray(product.categories) && product.categories.length > 0 ? (
            <div className="bg-accent pb-20 pt-10">
              <div className="container">
                <h1 className="mb-7 text-3xl font-semibold">You May Also Like</h1>

                <div className="grid-layout">
                  {product.categories.map((cat) => (
                    <RelatedProducts
                      key={cat}
                      shop_category={product.shop_category}
                      category={cat}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Suspense>
      </section>
    );
  } catch (error) {
    console.error("❌ [SingleProductPage] Fetch failed:", error);
    return (
      <div className="h-screen w-full flex justify-center items-center text-3xl font-semibold text-center">
        Product Not Found
      </div>
    );
  }
};

export default SingleProductPage;
