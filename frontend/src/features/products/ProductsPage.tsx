import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  createProduct,
  getProducts,
} from "./api/productsApi";

import type {
  Product,
} from "@/types/product";


function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [name, setName] =
    useState("");

  const [sku, setSku] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [stock, setStock] =
    useState("");


  useEffect(() => {
    let cancelled = false;


    getProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch((error) => {
        if (
          !cancelled &&
          error instanceof Error
        ) {
          setMessage(
            error.message
          );
        }
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


  async function refreshProducts() {
    const data =
      await getProducts();

    setProducts(data);
  }


  function resetForm() {
    setName("");
    setSku("");
    setCategory("");
    setPrice("");
    setStock("");
  }


  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);


    try {
      await createProduct({
        name,
        sku,
        category,
        price: Number(price),
        stock: Number(stock),
      });


      resetForm();


      await refreshProducts();


      setMessage(
        "Product added successfully."
      );
    } catch (error) {
      if (error instanceof Error) {
        setMessage(
          error.message
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            Catalog
          </p>

          <h1>
            Products
          </h1>

          <p>
            Manage products, pricing and
            available stock.
          </p>
        </div>


        <div className="header-stat">
          <span>
            Total Products
          </span>

          <strong>
            {products.length}
          </strong>
        </div>
      </div>


      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              Add Product
            </h2>

            <p>
              Add a new product to your
              OmniPOS catalog.
            </p>
          </div>
        </div>


        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          <label>
            Product Name

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Example: French Fries"
              required
            />
          </label>


          <label>
            SKU

            <input
              type="text"
              value={sku}
              onChange={(event) =>
                setSku(
                  event.target.value
                )
              }
              placeholder="Example: FRIES-001"
              required
            />
          </label>


          <label>
            Category

            <input
              type="text"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              placeholder="Example: Food"
            />
          </label>


          <label>
            Price

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              placeholder="79"
              required
            />
          </label>


          <label>
            Starting Stock

            <input
              type="number"
              min="0"
              value={stock}
              onChange={(event) =>
                setStock(
                  event.target.value
                )
              }
              placeholder="25"
              required
            />
          </label>


          <div className="form-action">
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Adding..."
                : "+ Add Product"}
            </button>
          </div>
        </form>


        {message && (
          <p className="form-message">
            {message}
          </p>
        )}
      </section>


      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              Product Catalog
            </h2>

            <p>
              Products currently available
              in your store.
            </p>
          </div>
        </div>


        {loading && (
          <p>
            Loading products...
          </p>
        )}


        {!loading &&
          products.length === 0 && (
            <p>
              No products available.
            </p>
          )}


        <div className="product-grid">
          {products.map(
            (product) => (
              <article
                key={product.id}
                className="product-card"
              >
                <div className="product-top">
                  <span className="badge">
                    {product.category ||
                      "Uncategorized"}
                  </span>


                  <span
                    className={
                      product.stock > 0
                        ? "stock-status"
                        : "stock-status out"
                    }
                  >
                    {product.stock > 0
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>
                </div>


                <h3>
                  {product.name}
                </h3>


                <div className="product-price">
                  ₱
                  {product.price.toFixed(
                    2
                  )}
                </div>


                <div className="product-details">
                  <span>
                    SKU
                  </span>

                  <strong>
                    {product.sku}
                  </strong>


                  <span>
                    Stock
                  </span>

                  <strong>
                    {product.stock}
                  </strong>


                  <span>
                    Product ID
                  </span>

                  <strong>
                    {product.id}
                  </strong>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}


export default ProductsPage;