"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { MdOutlineStar, MdOutlineStarBorder } from "react-icons/md";
import { useAppSelector } from "@/lib/hooks";

type RatingStarProps = {
  productId: string;
  initialRating?: number;
  className?: string;
};

const RatingStar = ({ productId, initialRating = 0, className }: RatingStarProps) => {
  const [rating, setRating] = useState(initialRating); // note affichée (étoiles)
  const [hover, setHover] = useState(0); // survol
  const [avgRating, setAvgRating] = useState(initialRating); // moyenne en base
  const [reviewCount, setReviewCount] = useState(0); // nombre d'avis
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);

  // 🔹 Charger la moyenne et le nombre d'avis depuis la base
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        const data = await res.json();
        setReviewCount(data.reviews.length);

        const productRes = await fetch(`/api/products/${productId}`);
        const product = await productRes.json();
        setAvgRating(product.rating || 0);
      } catch (err) {
        console.error("Erreur fetchReviews:", err);
      }
    };
    fetchReviews();
  }, [productId]);

  const handleClick = async (value: number) => {
    if (!userEmail) {
      console.warn("⚠️ Aucun utilisateur connecté");
      return;
    }

    try {
      // ✅ Met à jour immédiatement l'affichage des étoiles
      setRating(value);

      // ✅ Envoi de l'avis (updateOne + upsert côté back)
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userEmail,
          productId,
          rating: value,
          comment: "User rating",
        }),
      });

      // ✅ Récupération de la moyenne recalculée
      const res = await fetch(`/api/products/${productId}`);
      const updatedProduct = await res.json();
      setAvgRating(updatedProduct.rating);
    } catch (error) {
      console.error("💥 Erreur lors de l'envoi du rating:", error);
    }
  };

  return (
    <div className={cn("flex gap-1 items-center text-lg", className)}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={index}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer"
          >
            {(hover || rating) >= starValue ? (
              <MdOutlineStar className="text-yellow-400" />
            ) : (
              <MdOutlineStarBorder className="text-yellow-400" />
            )}
          </span>
        );
      })}
      {/* 🔹 Affiche la moyenne et le nombre d'avis */}
      <span className="ml-2 text-sm text-gray-600">
        Moyenne: {avgRating.toFixed(1)}/5 ({reviewCount} avis)
      </span>
    </div>
  );
};

export default RatingStar;
