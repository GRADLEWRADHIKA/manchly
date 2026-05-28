import React, { useEffect, useState } from "react";

const API =
  "https://server.manchly.com";

export default function WebinarManager() {
  const B = {
    bg: "#000000",
    card: "#111111",
    sidebar: "#0A0A0A",
    orange: "#FFC107",
    border: "rgba(255,255,255,0.1)",
    textSec: "#A1A1AA",
  };

  const token =
    localStorage.getItem("token");

  const [loading, setLoading] =
    useState(false);

  const [webinars, setWebinars] =
    useState([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState({
      title: "",
      description: "",
      date: "",
      time: "",
      thumbnail: "",
      price: "",
    });

  // =====================================
  // FETCH WEBINARS
  // =====================================

  const fetchWebinars =
    async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API}/webinars/my-webinars`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        console.log(
          "WEBINARS:",
          data
        );

        if (data.success) {
          setWebinars(
            Array.isArray(
              data.data
            )
              ? data.data
              : []
          );
        } else {
          setWebinars([]);
        }
      } catch (error) {
        console.error(error);

        setWebinars([]);
      } finally {
        setLoading(false);
      }
    };

  // =====================================
  // CREATE WEBINAR
  // =====================================

  const createWebinar =
    async () => {
      try {
        setLoading(true);

        const payload = {
          title: form.title,
          description:
            form.description,
          date: form.date,
          time: form.time,
          thumbnail:
            form.thumbnail,
          price: Number(
            form.price
          ),
        };

        console.log(
          "CREATE WEBINAR:",
          payload
        );

        const response =
          await fetch(
            `${API}/webinars`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(
                payload
              ),
            }
          );

        const data =
          await response.json();

        console.log(
          "WEBINAR RESPONSE:",
          data
        );

        if (data.success) {
          alert(
            "Webinar created successfully"
          );

          setShowCreate(false);

          setForm({
            title: "",
            description:
              "",
            date: "",
            time: "",
            thumbnail:
              "",
            price: "",
          });

          fetchWebinars();
        } else {
          alert(
            data.error
              ?.message ||
              "Failed to create webinar"
          );
        }
      } catch (error) {
        console.error(error);

        alert(
          "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchWebinars();
  }, []);

  return (
    <div
      style={{
        background: B.bg,
        minHeight: "100vh",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              color: B.orange,
              margin: 0,
            }}
          >
            Webinar Manager
          </h1>

          <p
            style={{
              color: B.textSec,
              marginTop: 8,
            }}
          >
            Manage your webinars
          </p>
        </div>

        <button
          onClick={() =>
            setShowCreate(
              !showCreate
            )
          }
          style={{
            background: B.orange,
            color: "#000",
            border: "none",
            padding:
              "12px 20px",
            borderRadius: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {showCreate
            ? "Close"
            : "Create Webinar"}
        </button>
      </div>

      {/* CREATE */}

      {showCreate && (
        <div
          style={{
            background: B.card,
            border: `1px solid ${B.border}`,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <textarea
              placeholder="Description"
              rows={5}
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({
                  ...form,
                  time:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <input
              placeholder="Thumbnail URL"
              value={
                form.thumbnail
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  thumbnail:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price:
                    e.target.value,
                })
              }
              style={inputStyle(B)}
            />

            <button
              onClick={
                createWebinar
              }
              disabled={loading}
              style={{
                background:
                  B.orange,
                color: "#000",
                border: "none",
                padding:
                  "16px",
                borderRadius: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {loading
                ? "Creating..."
                : "Create Webinar"}
            </button>
          </div>
        </div>
      )}

      {/* LIST */}

      {loading ? (
        <div>Loading...</div>
      ) : webinars.length === 0 ? (
        <div
          style={{
            background: B.card,
            border: `1px solid ${B.border}`,
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
            color: B.textSec,
          }}
        >
          No webinars found
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: 20,
          }}
        >
          {webinars.map(
            (webinar) => (
              <div
                key={webinar.id}
                style={{
                  background:
                    B.card,
                  border: `1px solid ${B.border}`,
                  borderRadius: 20,
                  overflow:
                    "hidden",
                }}
              >
                <img
                  src={
                    webinar.thumbnail ||
                    "https://via.placeholder.com/400x200"
                  }
                  alt=""
                  style={{
                    width:
                      "100%",
                    height: 180,
                    objectFit:
                      "cover",
                  }}
                />

                <div
                  style={{
                    padding: 20,
                  }}
                >
                  <h3
                    style={{
                      color:
                        B.orange,
                    }}
                  >
                    {
                      webinar.title
                    }
                  </h3>

                  <p
                    style={{
                      color:
                        B.textSec,
                    }}
                  >
                    {
                      webinar.description
                    }
                  </p>

                  <div
                    style={{
                      marginTop: 14,
                    }}
                  >
                    <div>
                      📅{" "}
                      {
                        webinar.date
                      }
                    </div>

                    <div>
                      ⏰{" "}
                      {
                        webinar.time
                      }
                    </div>

                    <div>
                      ₹
                      {
                        webinar.price
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function inputStyle(B) {
  return {
    background: B.sidebar,
    border: `1px solid ${B.border}`,
    padding: "14px",
    borderRadius: 12,
    color: "white",
    outline: "none",
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
  };
}