import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type District = { id: string; cidade: string; nome: string };
export type Neighborhood = { id: string; cidade: string; district_id: string | null; nome: string };
export type HealthUnit = {
  id: string;
  cidade: string;
  district_id: string | null;
  neighborhood_id: string | null;
  nome: string;
  cnes: string | null;
  tipo: string | null;
};

/** Distritos (sanitários ou sede) de uma cidade. */
export function useDistritos(cidade: string | null | undefined) {
  const [data, setData] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cidade) {
      setData([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    supabase
      .from("districts")
      .select("id, cidade, nome")
      .eq("cidade", cidade)
      .order("nome")
      .then(({ data: rows }) => {
        if (!cancel) {
          setData((rows ?? []) as District[]);
          setLoading(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [cidade]);

  return { data, loading };
}

/** Bairros de uma cidade (filtrável por distrito). */
export function useBairros(cidade: string | null | undefined, districtId?: string | null) {
  const [data, setData] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cidade) {
      setData([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    let q = supabase.from("neighborhoods").select("id, cidade, district_id, nome").eq("cidade", cidade);
    if (districtId) q = q.eq("district_id", districtId);
    q.order("nome").then(({ data: rows }) => {
      if (!cancel) {
        setData((rows ?? []) as Neighborhood[]);
        setLoading(false);
      }
    });
    return () => {
      cancel = true;
    };
  }, [cidade, districtId]);

  return { data, loading };
}

/** UBS de uma cidade, opcionalmente filtradas por distrito e/ou bairro. */
export function useUbs(
  cidade: string | null | undefined,
  districtId?: string | null,
  neighborhoodId?: string | null,
) {
  const [data, setData] = useState<HealthUnit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cidade) {
      setData([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    let q = supabase
      .from("health_units")
      .select("id, cidade, district_id, neighborhood_id, nome, cnes, tipo")
      .eq("cidade", cidade)
      .eq("ativo", true);
    if (districtId) q = q.eq("district_id", districtId);
    if (neighborhoodId) q = q.eq("neighborhood_id", neighborhoodId);
    q.order("nome").then(({ data: rows }) => {
      if (!cancel) {
        setData((rows ?? []) as HealthUnit[]);
        setLoading(false);
      }
    });
    return () => {
      cancel = true;
    };
  }, [cidade, districtId, neighborhoodId]);

  return { data, loading };
}
