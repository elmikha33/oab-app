"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);

  async function carregar() {
    const { data, error } = await supabase
      .from("questoes_oab")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      return;
    }

    setQuestoes(data || []);
  }

  useEffect(() => {
    carregar();

    const channel = supabase
      .channel("questoes-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questoes_oab",
        },
        () => {
          carregar();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      carregar();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {questoes.map((q, i) => (
        <div
          key={q.id || i}
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            borderLeft: "6px solid #2563eb",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {q.materia}
            </span>

            {q.tema && (
              <span
                style={{
                  background: "#eef2ff",
                  color: "#3730a3",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "13px",
                }}
              >
                {q.tema}
              </span>
            )}
          </div>

          <h3
            style={{
              fontSize: "20px",
              lineHeight: 1.8,
              marginBottom: "24px",
              color: "#111827",
            }}
          >
            {q.enunciado}
          </h3>

          {Array.isArray(q.alternativas) &&
            q.alternativas.map((alt: string, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  marginBottom: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "#fafafa",
                  lineHeight: 1.6,
                }}
              >
                <strong>
                  {String.fromCharCode(65 + idx)})
                </strong>{" "}
                {alt}
              </div>
            ))}

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "#ecfdf5",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              color: "#065f46",
              fontWeight: 700,
            }}
          >
            Gabarito: {String.fromCharCode(65 + Number(q.gabarito))}
          </div>

          {q.comentario && (
            <div
              style={{
                marginTop: "12px",
                padding: "14px",
                background: "#eff6ff",
                borderRadius: "12px",
                border: "1px solid #bfdbfe",
                lineHeight: 1.7,
                color: "#1e3a8a",
              }}
            >
              <strong>Comentário:</strong>
              <br />
              {q.comentario}
            </div>
          )}
        </div>
      ))}

      {questoes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            color: "#6b7280",
          }}
        >
          Nenhuma questão encontrada.
        </div>
      )}
    </div>
  );
}