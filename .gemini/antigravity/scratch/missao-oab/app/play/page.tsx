import { createClient } from "@supabase/supabase-js";

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: questoes, error } = await supabase
    .from("questoes_oab")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 p-10 text-white">
        <h1 className="text-3xl font-bold text-red-500">
          Erro ao carregar questões
        </h1>
        <p className="mt-4">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Questões OAB
        </h1>

        {!questoes || questoes.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
            Nenhuma questão encontrada.
          </div>
        ) : (
          <div className="space-y-8">
            {questoes.map((q: any) => (
              <div
                key={q.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl"
              >
                <div className="flex gap-3 flex-wrap mb-5">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                    {q.materia}
                  </span>

                  {q.tema && (
                    <span className="bg-gray-700 text-gray-200 text-xs px-3 py-1 rounded-full">
                      {q.tema}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-white leading-9 mb-6">
                  {q.enunciado}
                </h2>

                <div className="space-y-3">
                  {Array.isArray(q.alternativas) &&
                    q.alternativas.map(
                      (alt: string, index: number) => (
                        <div
                          key={index}
                          className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-100 hover:bg-gray-700 transition"
                        >
                          <span className="font-bold mr-2">
                            {String.fromCharCode(65 + index)})
                          </span>
                          {alt}
                        </div>
                      )
                    )}
                </div>

                <div className="mt-6 bg-green-900 border border-green-700 rounded-xl p-4">
                  <span className="font-bold text-green-300">
                    Gabarito:
                  </span>{" "}
                  <span className="text-white">
                    {String.fromCharCode(
                      65 + Number(q.gabarito)
                    )}
                  </span>
                </div>

                {q.comentario && (
                  <div className="mt-4 bg-blue-950 border border-blue-800 rounded-xl p-4">
                    <p className="font-bold text-blue-300 mb-2">
                      Comentário
                    </p>
                    <p className="text-gray-200 leading-7">
                      {q.comentario}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}