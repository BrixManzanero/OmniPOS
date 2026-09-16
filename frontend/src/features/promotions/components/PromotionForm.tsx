import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  getProducts,
} from "@/features/products/api/productsApi";

import type {
  Product,
} from "@/types/product";

import type {
  DiscountType,
  PromotionChannel,
  PromotionCreate,
  TargetType,
} from "../types/promotion.types";


type Props = {
  creating: boolean;

  onCreate: (
    promotion: PromotionCreate
  ) => Promise<void>;
};


function PromotionForm({
  creating,
  onCreate,
}: Props) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [message, setMessage] =
    useState("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [discountType, setDiscountType] =
    useState<DiscountType>("PERCENT");

  const [discountValue, setDiscountValue] =
    useState("");

  const [targetType, setTargetType] =
    useState<TargetType>("ALL");

  const [targetProductId, setTargetProductId] =
    useState("");

  const [targetCategory, setTargetCategory] =
    useState("");

  const [channel, setChannel] =
    useState<PromotionChannel>("ALL");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [startHour, setStartHour] =
    useState("");

  const [endHour, setEndHour] =
    useState("");


  /* =========================
     PRODUCT OPTIONS
  ========================= */

  useEffect(() => {
    let cancelled = false;


    getProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch(() => {
        // Non-blocking: the form still
        // works for ALL and CATEGORY.
      });


    return () => {
      cancelled = true;
    };
  }, []);


  const categories = Array.from(
    new Set(
      products
        .map(
          (product) =>
            product.category
        )
        .filter(
          (category): category is string =>
            Boolean(category)
        )
    )
  );


  function resetForm() {
    setName("");
    setDescription("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setTargetType("ALL");
    setTargetProductId("");
    setTargetCategory("");
    setChannel("ALL");
    setStartDate("");
    setEndDate("");
    setStartHour("");
    setEndHour("");
  }


  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");


    try {
      await onCreate({
        name,

        description:
          description || null,

        discount_type: discountType,

        discount_value:
          Number(discountValue),

        target_type: targetType,

        target_product_id:
          targetType === "PRODUCT"
            ? Number(targetProductId)
            : null,

        target_category:
          targetType === "CATEGORY"
            ? targetCategory
            : null,

        channel,

        start_date:
          startDate || null,

        end_date:
          endDate || null,

        start_hour:
          startHour === ""
            ? null
            : Number(startHour),

        end_hour:
          endHour === ""
            ? null
            : Number(endHour),

        status: "DRAFT",
        source: "MANUAL",
      });


      resetForm();


      setMessage(
        "Promotion saved as draft."
      );
    } catch (error) {
      if (error instanceof Error) {
        setMessage(
          error.message
        );
      }
    }
  }


  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>
            Create Promotion
          </h2>

          <p>
            New promotions start as drafts
            and need approval before running.
          </p>
        </div>
      </div>


      <form
        className="product-form"
        onSubmit={handleSubmit}
      >
        <label>
          Promotion Name

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Example: Merienda Hours 15% Off"
            required
          />
        </label>


        <label>
          Discount Type

          <select
            value={discountType}
            onChange={(event) =>
              setDiscountType(
                event.target
                  .value as DiscountType
              )
            }
          >
            <option value="PERCENT">
              Percentage (%)
            </option>

            <option value="FIXED">
              Fixed Amount
            </option>
          </select>
        </label>


        <label>
          Discount Value

          <input
            type="number"
            min="0"
            step="0.01"
            max={
              discountType === "PERCENT"
                ? 100
                : undefined
            }
            value={discountValue}
            onChange={(event) =>
              setDiscountValue(
                event.target.value
              )
            }
            placeholder="15"
            required
          />
        </label>


        <label>
          Applies To

          <select
            value={targetType}
            onChange={(event) =>
              setTargetType(
                event.target
                  .value as TargetType
              )
            }
          >
            <option value="ALL">
              All Products
            </option>

            <option value="CATEGORY">
              A Category
            </option>

            <option value="PRODUCT">
              A Single Product
            </option>
          </select>
        </label>


        {targetType === "CATEGORY" && (
          <label>
            Category

            <input
              type="text"
              list="promotion-categories"
              value={targetCategory}
              onChange={(event) =>
                setTargetCategory(
                  event.target.value
                )
              }
              placeholder="Example: Drinks"
              required
            />

            <datalist id="promotion-categories">
              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  />
                )
              )}
            </datalist>
          </label>
        )}


        {targetType === "PRODUCT" && (
          <label>
            Product

            <select
              value={targetProductId}
              onChange={(event) =>
                setTargetProductId(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select a product
              </option>

              {products.map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                  </option>
                )
              )}
            </select>
          </label>
        )}


        <label>
          Channel

          <select
            value={channel}
            onChange={(event) =>
              setChannel(
                event.target
                  .value as PromotionChannel
              )
            }
          >
            <option value="ALL">
              POS and Online
            </option>

            <option value="POS">
              POS Only
            </option>

            <option value="ONLINE">
              Online Only
            </option>
          </select>
        </label>


        <label>
          Starts

          <input
            type="datetime-local"
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
          />
        </label>


        <label>
          Ends

          <input
            type="datetime-local"
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
          />
        </label>


        <label>
          Daily Start Hour

          <input
            type="number"
            min="0"
            max="23"
            value={startHour}
            onChange={(event) =>
              setStartHour(
                event.target.value
              )
            }
            placeholder="14"
          />
        </label>


        <label>
          Daily End Hour

          <input
            type="number"
            min="0"
            max="23"
            value={endHour}
            onChange={(event) =>
              setEndHour(
                event.target.value
              )
            }
            placeholder="16"
          />
        </label>


        <label>
          Description

          <input
            type="text"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Optional note for your team"
          />
        </label>


        <div className="form-action">
          <button
            type="submit"
            className="primary-button"
            disabled={creating}
          >
            {creating
              ? "Saving..."
              : "+ Create Promotion"}
          </button>
        </div>
      </form>


      {message && (
        <p className="form-message">
          {message}
        </p>
      )}
    </section>
  );
}


export default PromotionForm;
