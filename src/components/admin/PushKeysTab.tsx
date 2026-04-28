import { useState } from "react";

const VAPID_PUBLIC_KEY =
  "BEUwolCHHTeUsqVpf96fwnuZHboKS671cpkYk8PYkTKr6z8BiYe0bGL9fJK96-HpEKP6z1Ahrmw-v5B2xkCwksA";

const VAPID_PRIVATE_KEY = "wT4pK6bN5oYsR_qj1fXmZdHv8aLgC3eUiB2nW0xPyMA";

const VAPID_SUBJECT = "mailto:admin@maedigital.app";

function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {label}
        </label>
        <div className="flex gap-2">
          {secret && (
            <button
              onClick={() => setRevealed((v) => !v)}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
              type="button"
            >
              {revealed ? "Ocultar" : "Mostrar"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded-full bg-[#1a1557] text-white hover:opacity-90"
            type="button"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
      <div className="font-mono text-xs break-all bg-gray-50 border border-gray-200 rounded-lg p-3">
        {revealed ? value : "•".repeat(Math.min(value.length, 48))}
      </div>
    </div>
  );
}

export function PushKeysTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1557]">Chaves VAPID (Push Web)</h2>
        <p className="text-sm text-gray-600 mt-1">
          Estas chaves autenticam o servidor do MãeDigital junto aos serviços de push dos navegadores
          (Chrome, Firefox, Edge, Safari iOS 16.4+). Use os valores abaixo ao configurar os secrets do backend.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong>Importante:</strong> a chave privada nunca deve ser compartilhada publicamente nem comitada
        em repositórios públicos. Guarde-a em um gerenciador de senhas. Se vazar, gere um novo par.
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <CopyField label="VAPID_PUBLIC_KEY" value={VAPID_PUBLIC_KEY} />
        <CopyField label="VAPID_PRIVATE_KEY" value={VAPID_PRIVATE_KEY} secret />
        <CopyField label="VAPID_SUBJECT" value={VAPID_SUBJECT} />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 space-y-2">
        <p className="font-semibold text-[#1a1557]">Como usar</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Copie cada valor acima.</li>
          <li>Cole no formulário de secrets do Lovable Cloud quando solicitado.</li>
          <li>Após salvar, o backend de envio de push será ativado automaticamente.</li>
        </ol>
      </div>
    </div>
  );
}
