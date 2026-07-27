"use client";

import {
  CartItem,
  addToCart,
  decrementAmount,
  handleCountValue,
  incrementAmount,
  removeFromCart,
} from "@/lib/features/cart/cartSlice";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { PiBasketFill } from "react-icons/pi";
import { useDispatch } from "react-redux";
import { Button } from "./ui/button";
import { AllProduct } from "@/types/product";
import { useAnalyticsEvent } from "@/lib/hooks/useAnalyticsEvent";

type AddToCartWrapperProps = {
  product: AllProduct;
  btnStyle?: "style-1" | "style-2" | "style-3" | "style-4" | "withoutCounter";
};

const normalizeCartItem = (
  product: AllProduct,
  amount: number,
  selectedColor?: string,
  selectedSize?: string
): CartItem => ({
  _id: product._id,
  title: product.title,
  originalId: product.originalId,
  description: product.description,
  price: product.price,
  oldPrice: product.oldPrice,
  promo: product.promo,
  categories: product.categories ?? [],
  image: product.image ?? [],
  rating: product.rating ?? 0,
  amount,
  shop_category: product.shop_category,
  unit_of_measure: product.unit_of_measure ?? "",
  selectedColor,
  selectedSize,
  authors: product.authors ?? [],
  reserved: product.reserved ?? 0,
  sales: product.sales ?? 0,
});

const AddToCartBtnWrapper = ({
  product,
  btnStyle = "style-1",
}: AddToCartWrapperProps) => {
  const router = useRouter();
  const [addedItem, setAddedItem] = useState<undefined | CartItem>();
  const [disableBtn, setDisableBtn] = useState(true);
  const { cartItems, countValue, selectedColor, selectedSize } = useAppSelector(
    (state) => state.cart
  );
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);
  const dispatch = useDispatch();
  const { sendEvent } = useAnalyticsEvent(userEmail);

  useEffect(() => {
    setAddedItem(cartItems.find((item) => item.originalId === product.originalId));
    dispatch(handleCountValue("none"));
  }, [product.originalId, cartItems, dispatch]);

  const handleAddToCart = async (withCounter: boolean) => {
    if (product.shop_category === "clothing") {
      if (selectedColor && selectedSize) {
        if (withCounter) {
          addedItem
            ? dispatch(removeFromCart(product.originalId))
            : dispatch(
                addToCart(
                  normalizeCartItem(product, countValue, selectedColor, selectedSize)
                )
              );
        } else {
          dispatch(
            addToCart(
              normalizeCartItem(product, countValue, selectedColor, selectedSize)
            )
          );
        }
      } else {
        router.push(`/products/${product.originalId}`);
      }
    } else {
      if (withCounter) {
        addedItem
          ? dispatch(removeFromCart(product.originalId))
          : dispatch(addToCart(normalizeCartItem(product, countValue)));
      } else {
        dispatch(addToCart(normalizeCartItem(product, 1, selectedColor, selectedSize)));
      }
    }

    await sendEvent(product, "click");
  };

  useEffect(() => {
    if (product?.shop_category === "clothing") {
      setDisableBtn(!(selectedColor && selectedSize));
    } else {
      setDisableBtn(false);
    }
  }, [selectedColor, selectedSize, product.shop_category]);

  const Counter = () => (
    <div className="flex w-full sm:w-auto relative z-10 items-center bg-background rounded-lg overflow-hidden border">
      <Button
        type="button"
        variant="outline"
        className="h-9 w-9 rounded-none border-none"
        onClick={async () => {
          dispatch(decrementAmount(product.originalId));
          await sendEvent(product, "click");
        }}
      >
        -
      </Button>
      <span className="px-3 flex-1 text-center">{addedItem?.amount}</span>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-9 rounded-none border-none"
        onClick={async () => {
          dispatch(incrementAmount(product.originalId));
          await sendEvent(product, "click");
        }}
      >
        +
      </Button>
    </div>
  );

  return (
    <>
      {btnStyle === "withoutCounter" && (
        <Button
          className="flex gap-2 items-center w-fit px-5 text-sm sm:basis-1/2 sm:w-auto sm:text-base"
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={disableBtn}
        >
          <span className="text-lg">
            <FaShoppingCart />
          </span>
          <span>{addedItem ? "Added" : "Add to cart"}</span>
        </Button>
      )}

      {btnStyle === "style-1" && (
        <>
          {!addedItem ? (
            <Button
              className="w-full flex gap-2 items-center text-xs sm:text-base relative z-10"
              type="button"
              onClick={() => handleAddToCart(false)}
            >
              <span className="text-lg">
                <FaShoppingCart />
              </span>
              <span>Add To Cart</span>
            </Button>
          ) : (
            <Counter />
          )}
        </>
      )}

      {btnStyle === "style-2" && (
        <>
          {!addedItem ? (
            <Button
              type="button"
              className="bg-transparent border-input text-primary flex gap-2 items-center rounded-3xl hover:bg-primary hover:text-white text-xs sm:text-base w-full sm:w-auto relative z-10"
              onClick={() => handleAddToCart(false)}
            >
              <span className="text-xl">
                <PiBasketFill />
              </span>
              <span>Cart</span>
            </Button>
          ) : (
            <Counter />
          )}
        </>
      )}

      {btnStyle === "style-3" && (
        <>
          {!addedItem ? (
            <Button
              className="hover:bg-primary hover:text-white"
              type="button"
              variant="outline"
              title="Add to cart"
              onClick={() => handleAddToCart(false)}
            >
              <span className="text-sm sm:text-base">Add To Cart</span>
            </Button>
          ) : (
            <Counter />
          )}
        </>
      )}

      {btnStyle === "style-4" && (
        <>
          {!addedItem ? (
            <Button
              className="h-8 w-full sm:w-8 hover:bg-primary hover:text-white"
              type="button"
              variant="outline"
              title="Add to cart"
              onClick={() => handleAddToCart(false)}
            >
              <span className="text-lg">+</span>
            </Button>
          ) : (
            <Counter />
          )}
        </>
      )}
    </>
  );
};

export default AddToCartBtnWrapper;
