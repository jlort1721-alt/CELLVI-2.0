
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface Point {
    id: string;
    lat: number;
    lng: number;
}

// Haversine Distance (km)
function getDistance(p1: Point, p2: Point) {
    const R = 6371; // Earth Radius
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 2-Opt Algorithm (TSP Solver)
function solveTSP(points: Point[]) {
    // 1. Initial Greedy Solution (Nearest Neighbor)
    let current = points[0]; // Depot
    let unvisited = new Set(points.slice(1));
    let route = [current];

    while (unvisited.size > 0) {
        let nearest = null;
        let minDist = Infinity;

        for (const p of unvisited) {
            const d = getDistance(current, p);
            if (d < minDist) {
                minDist = d;
                nearest = p;
            }
        }

        if (nearest) {
            route.push(nearest);
            unvisited.delete(nearest);
            current = nearest;
        }
    }
    // Return to depot? Assume open route or closed? Typically closed for VRP.
    // Let's assume return to start.
    route.push(points[0]);

    // 2. 2-Opt Improvement (Swap Edges)
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 1; i < route.length - 2; i++) {
            for (let j = i + 1; j < route.length - 1; j++) {
                // Current distance
                const d1 = getDistance(route[i - 1], route[i]) + getDistance(route[j], route[j + 1]);
                // Swapped distance
                const d2 = getDistance(route[i - 1], route[j]) + getDistance(route[i], route[j + 1]);

                if (d2 < d1) {
                    // Reverse segment i to j
                    const segment = route.slice(i, j + 1).reverse();
                    route.splice(i, segment.length, ...segment);
                    improved = true;
                }
            }
        }
    }

    // Calculate total distance
    let totalDist = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalDist += getDistance(route[i], route[i + 1]);
    }

    return { route, totalDist };
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { depot, stops } = await req.json();

        if (!depot || !stops || !Array.isArray(stops)) {
            throw new Error("Invalid Input: 'depot' and 'stops' array required.");
        }

        // Combine all points
        const points = [{ ...depot, id: 'depot' }, ...stops];

        // Compute
        const start = performance.now();
        const result = solveTSP(points);
        const duration = performance.now() - start;

        return new Response(JSON.stringify({
            optimized_route: result.route,
            total_distance_km: result.totalDist,
            computation_ms: duration,
            algorithm: "2-Opt Heuristic"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
});
