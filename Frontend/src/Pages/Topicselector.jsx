import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import API from "../services/api.js";

const COLORS = {
  navy: "#0F172A",
  navyMuted: "#475569",
  blue: "#2563EB",
  blueLight: "#E6F1FB",
  orange: "#EA8C0C",
  orangeLight: "#FFF3E0",
  border: "#E2E8F0",
  bg: "#F8FAFC",
};

export default function TopicSelector() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSections = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(`/upload/${id}/sections`);
        if (cancelled) return;
        setSections(res.data.sections || []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || "Couldn't load sections for this document."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSections();
    return () => { cancelled = true; };
  }, [id]);

  const allSelected = sections.length > 0 && selected.size === sections.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleTopic = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(sections.map((s) => s.index)));
  };

  const updateActiveCard = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackCenter = track.scrollLeft + track.clientWidth / 2;

    let closestIndex = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - trackCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateActiveCard();

    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActiveCard);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateActiveCard, sections]);

  // click-and-drag scrolling
  const dragState = useRef({ isDown: false, startX: 0, startScroll: 0 });
  const onPointerDown = (e) => {
    const track = trackRef.current;
    dragState.current = {
      isDown: true,
      startX: e.pageX,
      startScroll: track.scrollLeft,
    };
    track.style.cursor = "grabbing";
  };
  const onPointerMove = (e) => {
    if (!dragState.current.isDown) return;
    const track = trackRef.current;
    const dx = e.pageX - dragState.current.startX;
    track.scrollLeft = dragState.current.startScroll - dx;
  };
  const endDrag = () => {
    dragState.current.isDown = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  const handleGenerate = () => {
    const sectionsParam = Array.from(selected).sort((a, b) => a - b).join(",");
    navigate(`/flashcards/${id}?sections=${sectionsParam}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMuted, fontFamily: "-apple-system, sans-serif" }}>
        Loading sections…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>
        <p style={{ color: "#DC2626" }}>{error}</p>
        <button onClick={() => navigate("/dashboard")} style={{ color: COLORS.blue, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: COLORS.bg,
        borderRadius: 16,
        padding: "24px 0",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px 18px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: COLORS.navy,
            }}
          >
            Choose sections to generate
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13.5,
              color: COLORS.navyMuted,
            }}
          >
            {selected.size} of {sections.length} selected
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            background: allSelected ? COLORS.blueLight : "#fff",
            border: `1px solid ${allSelected ? COLORS.blue : COLORS.border}`,
            borderRadius: 999,
            padding: "8px 16px",
            transition: "all 180ms ease",
          }}
          onClick={toggleAll}
        >
          <Checkbox checked={allSelected} indeterminate={someSelected} />
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: allSelected ? COLORS.blue : COLORS.navy,
            }}
          >
            Select all
          </span>
        </label>
      </div>

      <div
        ref={trackRef}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          scrollSnapType: "x proximity",
          padding: "12px 28px 20px",
          cursor: "grab",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {sections.map((section, i) => {
          const isActive = i === activeIndex;
          const isChecked = selected.has(section.index);
          return (
            <div
              key={section.index}
              ref={(el) => (cardRefs.current[i] = el)}
              onClick={() => toggleTopic(section.index)}
              style={{
                position: "relative",
                flex: "0 0 auto",
                width: isActive ? 210 : 176,
                height: isActive ? 132 : 112,
                background: isChecked ? COLORS.blueLight : "#fff",
                border: `1.5px solid ${
                  isChecked ? COLORS.blue : COLORS.border
                }`,
                borderRadius: 14,
                padding: "16px 16px 14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                transition:
                  "width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1), background 200ms ease, border-color 200ms ease, box-shadow 320ms ease",
                transform: isActive ? "translateY(-6px)" : "translateY(0)",
                boxShadow: isActive
                  ? "0 12px 24px rgba(37, 99, 235, 0.14)"
                  : "0 1px 2px rgba(15, 23, 42, 0.04)",
                scrollSnapAlign: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTopic(section.index);
                }}
              >
                <Checkbox checked={isChecked} />
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.orange,
                  background: COLORS.orangeLight,
                  padding: "3px 8px",
                  borderRadius: 6,
                  width: "fit-content",
                }}
              >
                {`p.${section.pageStart}-${section.pageEnd}`}
              </span>

              <p
                style={{
                  margin: 0,
                  fontSize: isActive ? 14.5 : 13.5,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  color: COLORS.navy,
                  transition: "font-size 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {section.title}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "8px 28px 0", display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleGenerate}
          disabled={selected.size === 0}
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            border: "none",
            background: selected.size === 0 ? "#CBD5E1" : COLORS.blue,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: selected.size === 0 ? "not-allowed" : "pointer",
            transition: "background 180ms ease",
          }}
        >
          Generate Flashcards {selected.size > 0 ? `(${selected.size} section${selected.size > 1 ? "s" : ""})` : ""}
        </button>
      </div>
    </div>
  );
}

function Checkbox({ checked, indeterminate }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: `1.5px solid ${
          checked || indeterminate ? "#2563EB" : "#CBD5E1"
        }`,
        background: checked || indeterminate ? "#2563EB" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 160ms ease",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={13} color="#fff" strokeWidth={3} />}
      {indeterminate && !checked && (
        <div style={{ width: 9, height: 2, background: "#2563EB", borderRadius: 1 }} />
      )}
    </div>
  );
}
