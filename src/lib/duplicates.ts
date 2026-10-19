// Detecção de produtos duplicados ou semelhantes.
// Nunca bloqueia o cadastro: apenas aponta possíveis duplicidades para o usuário decidir.

export interface DuplicateCandidateInput {
  name: string;
  brand?: string;
  category?: string;
}

export interface ProductLike extends DuplicateCandidateInput {
  id: string;
}

export interface DuplicateMatch<T extends ProductLike> {
  product: T;
  score: number; // 0 a 100
  reasons: string[];
}

export function normalizeText(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

// Distância de Levenshtein simples para nomes curtos
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return dp[n];
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const tokenScore = jaccard(tokens(na), tokens(nb));
  const maxLen = Math.max(na.length, nb.length);
  const editScore = maxLen <= 40 ? 1 - levenshtein(na, nb) / maxLen : 0;
  return Math.max(tokenScore, editScore);
}

/**
 * Encontra produtos parecidos com o candidato.
 * Considera nome (igual, parecido ou com variação), marca e categoria.
 * Retorna ordenado do mais provável para o menos provável.
 */
export function findDuplicateCandidates<T extends ProductLike>(
  products: T[],
  candidate: DuplicateCandidateInput,
  excludeId?: string,
  minScore = 45
): DuplicateMatch<T>[] {
  const results: DuplicateMatch<T>[] = [];
  const candidateName = normalizeText(candidate.name);
  if (!candidateName) return [];

  for (const product of products) {
    if (excludeId && product.id === excludeId) continue;

    const reasons: string[] = [];
    let score = 0;

    const sim = nameSimilarity(candidate.name, product.name);
    if (normalizeText(product.name) === candidateName) {
      score += 70;
      reasons.push("Nome igual");
    } else if (sim >= 0.85) {
      score += 55;
      reasons.push("Nome muito parecido");
    } else if (sim >= 0.6) {
      score += 35;
      reasons.push("Nome parecido");
    } else if (sim >= 0.45) {
      score += 20;
      reasons.push("Nome com partes iguais");
    }

    const sameBrand =
      normalizeText(candidate.brand) &&
      normalizeText(candidate.brand) === normalizeText(product.brand);
    if (sameBrand) {
      score += 15;
      reasons.push("Mesma marca");
    }

    const sameCategory =
      normalizeText(candidate.category) &&
      normalizeText(candidate.category) === normalizeText(product.category);
    if (sameCategory) {
      score += 10;
      reasons.push("Mesma categoria");
    }

    if (score >= minScore && reasons.length > 0) {
      results.push({ product, score: Math.min(score, 100), reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Agrupa produtos já cadastrados que parecem duplicados entre si.
 * Usado na ferramenta de revisão de cadastros.
 */
export function findDuplicateGroups<T extends ProductLike>(products: T[]): T[][] {
  const groups: T[][] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    if (assigned.has(products[i].id)) continue;
    const matches = findDuplicateCandidates(products, products[i], products[i].id, 60)
      .map((m) => m.product)
      .filter((p) => !assigned.has(p.id));
    if (matches.length > 0) {
      const group = [products[i], ...matches];
      group.forEach((p) => assigned.add(p.id));
      groups.push(group);
    }
  }

  return groups;
}
