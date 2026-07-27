"use client";

import {
  CartItem,
  decrementAmount,
  incrementAmount,
} from "@/lib/features/cart/cartSlice";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAnalyticsEvent } from "@/lib/hooks/useAnalyticsEvent"; 

type CounterProps = {
  product: CartItem;
  quantity: number; // stock maximum disponible
  className?: string;
};

const Counter = ({ className, quantity, product }: CounterProps) => {
  const { cartItems } = useAppSelector((state) => state.cart);
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);
  const dispatch = useDispatch();
  const { sendEvent } = useAnalyticsEvent(userEmail); // ✅ hook analytics

  // ✅ Recherche tolérante : on compare par originalId OU par _id
  const addedItem = cartItems.find(
    (item) =>
      item.originalId === product.originalId ||
      item._id === product._id
  );

  const handleCount = async (num: number) => {
    if (!addedItem) return;

    // ✅ sécuriser amount avec valeur par défaut
    let currentAmount = addedItem.amount ?? 1;
    let newAmount = currentAmount;

    if (num === 1) {
      dispatch(incrementAmount(addedItem.originalId));
      newAmount = currentAmount + 1;
    } else {
      dispatch(decrementAmount(addedItem.originalId));
      newAmount = Math.max(currentAmount - 1, 1); // jamais < 1
    }

    // ✅ Analytics avec la nouvelle quantité
    await sendEvent(product, "click", newAmount);
  };

  return (
    <div className={cn("flex items-center max-w-[200px]", className)}>
      {/* Bouton - */}
      <Button
        type="button"
        variant="outline"
        className="text-xl select-none"
        disabled={addedItem?.amount ? addedItem.amount <= 1 : true}
        onClick={() => handleCount(-1)}
      >
        -
      </Button>

      {/* Affichage quantité */}
      <Input
        className="text-center"
        readOnly
        value={addedItem?.amount ?? 1}
        type="number"
      />

      {/* Bouton + */}
      <Button
        type="button"
        variant="outline"
        className="text-xl select-none"
        disabled={addedItem?.amount ? addedItem.amount >= quantity : false}
        onClick={() => handleCount(1)}
      >
        +
      </Button>
    </div>
  );
};

export default Counter;
