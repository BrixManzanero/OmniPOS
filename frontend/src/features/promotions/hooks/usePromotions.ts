import {
  useEffect,
  useState,
} from "react";

import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotionStatus,
} from "../api/promotionsApi";

import type {
  Promotion,
  PromotionCreate,
  PromotionStatus,
} from "../types/promotion.types";


export function usePromotions() {
  const [
    promotions,
    setPromotions,
  ] = useState<Promotion[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;


    getPromotions()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setPromotions(data);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load promotions."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================
     REFRESH PROMOTIONS
  ========================= */

  async function refreshPromotions() {
    try {
      const data =
        await getPromotions();

      setPromotions(data);
      setError("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load promotions.";

      setError(message);

      throw error;
    }
  }


  /* =========================
     CREATE PROMOTION
  ========================= */

  async function handleCreatePromotion(
    promotion: PromotionCreate
  ) {
    try {
      setCreating(true);
      setError("");

      await createPromotion(
        promotion
      );

      await refreshPromotions();
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message
        );
      }

      throw error;
    } finally {
      setCreating(false);
    }
  }


  /* =========================
     CHANGE STATUS
  ========================= */

  async function handleChangeStatus(
    promotionId: number,
    status: PromotionStatus
  ) {
    try {
      setError("");

      await updatePromotionStatus(
        promotionId,
        status
      );

      await refreshPromotions();
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message
        );
      }

      throw error;
    }
  }


  /* =========================
     DELETE PROMOTION
  ========================= */

  async function handleDeletePromotion(
    promotionId: number
  ) {
    try {
      setError("");

      await deletePromotion(
        promotionId
      );

      await refreshPromotions();
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message
        );
      }

      throw error;
    }
  }


  return {
    promotions,
    loading,
    creating,
    error,

    handleCreatePromotion,
    handleChangeStatus,
    handleDeletePromotion,
    refreshPromotions,
  };
}
