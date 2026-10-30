import React from "react";
import Link from "@docusaurus/Link";
import CaseStudy, { Section, Highlights, StackGroups } from "../../components/dusk/CaseStudy";
import KvScene from "../../components/dusk/KvScene";

function Layers() {
  const rows = [
    { name: "Requests", note: "LMSYS-Chat-1M prompts, Poisson arrivals", mine: false },
    { name: "LTR scheduler", note: "a small ranker predicts output length; shortest first", mine: false },
    { name: "KV cache", note: "TurboQuant 4-bit pages: 2.83× the tokens in the same memory", mine: true },
    { name: "Decode attention", note: "BLASST block-sparse Triton kernels, patched into vLLM", mine: true },
    { name: "GPU", note: "one RTX 3090, 24 GB, Llama-3.1-8B", mine: false },
  ];
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 330" role="img" aria-label="Five layers from requests down to the GPU; the KV cache and decode attention layers are the ones I owned">
        {rows.map((r, i) => {
          const y = 14 + i * 62;
          return (
            <g key={r.name}>
              <rect x="10" y={y} width="940" height="48" rx="10" className={r.mine ? "d-box d-box--needle" : "d-box"} />
              <text x="30" y={y + 30}>
                {r.name}
              </text>
              <text x="230" y={y + 30} className="d-muted">
                {r.note}
              </text>
              {r.mine && (
                <text x="900" y={y + 30} className="d-muted" textAnchor="end">
                  my part
                </text>
              )}
              {i < rows.length - 1 && <path d={`M120 ${y + 48} V${y + 62}`} className="d-flow" />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function KvCache() {
  return (
    <CaseStudy slug="kv-cache" role="KV-cache layer owner, team of four" stage={<KvScene />}>
      <Section title="The question">
        <p>
          An LLM server keeps each request's attention keys and values, the KV cache, in GPU memory while it generates. Under load that
          memory runs out first. vLLM then preempts a request and has to swap or recompute its cache later, and the time to first token
          climbs for everyone queued behind it.
        </p>
        <p>
          Our FDU capstone started from a learning-to-rank scheduler, which orders requests by predicted output length to get close to
          shortest-job-first. The question was whether a KV-cache layer underneath it could cut latency further without hurting accuracy,
          and in which load range each technique pays off. I owned that layer.
        </p>
      </Section>

      <Section title="Where my work sat" figure={<Layers />}>
        <p>
          Quantization makes each page of KV smaller, so the same memory holds more concurrent requests and fewer of them are preempted.
          Sparsity skips attention blocks that contribute little, so decode reads less KV. Both went into the same vLLM build, measured on
          three engine versions (0.4.1, 0.8.5 and 0.25) with accuracy checked on GSM8K and perplexity.
        </p>
      </Section>

      <Section title="What it measured">
        <Highlights
          items={[
            {
              fig: "2.83×",
              unit: "token capacity",
              title: "4-bit KV at equal memory",
              body: "TurboQuant rotates before it quantizes, so 4-bit pages keep accuracy while holding 2.83 times the tokens.",
            },
            {
              fig: "10.7 s → 1.6 s",
              unit: "mean time to first token",
              title: "6.8× faster under load",
              body: "At 64 requests a second, mean TTFT fell 6.8 times and preemptions fell from 171 to 40.",
            },
            {
              fig: "1.33–1.75×",
              unit: "standalone kernel speed-up",
              title: "Block-sparse decode kernels in Triton",
              body: "I wrote BLASST attention decode kernels that skip low-weight blocks using the online softmax. They were lossless at 42% sparsity.",
            },
            {
              fig: "−22% / −47%",
              unit: "time per token / its P99",
              title: "Patched into the quantized path",
              body: "Runtime-patching vLLM's TurboQuant decode path with the sparse kernel cut time per output token by 22% and its P99 by 47%.",
            },
          ]}
        />
      </Section>

      <Section title="What did not work">
        <p>
          Quantization is not free. Time per output token rose in the configuration we wrote up, and end-to-end latency got worse, so 4-bit
          KV is the right call when time to first token is what users feel. The same sparse kernel was a net loss on vLLM's shared GQA
          kernel: of the 42.1% of blocks that could be skipped, only 18.5% actually were. It paid off only on the per-head quantized
          kernel.
        </p>
        <p>
          Two lessons I kept: read version metadata from the server, not the client, and run the reproduction commands in a clean
          environment before calling results final. The full story is in <Link to="/blog/kv-cache-capstone">a post on the capstone</Link>.
        </p>
      </Section>

      <Section title="Stack">
        <StackGroups
          groups={[
            ["Serving", ["vLLM 0.4.1, 0.8.5, 0.25", "PagedAttention", "TurboQuant", "Llama-3.1-8B"]],
            ["Kernels", ["Triton", "PyTorch", "CUDA on WSL2"]],
            ["Evaluation", ["LMSYS-Chat-1M", "Poisson load", "GSM8K", "perplexity"]],
          ]}
        />
      </Section>

      <Section title="What's next">
        <p>
          The original plan had three more pieces, left as future work: offloading KV by attention head, a lock-free Rust coordinator over
          vLLM's KV-connector API, and speculative decoding. Locally I run quantized 27B models on the same 3090; notes are in{" "}
          <Link to="/blog/27b-on-one-3090">27B on one 3090</Link>.
        </p>
      </Section>
    </CaseStudy>
  );
}
