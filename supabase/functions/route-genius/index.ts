
// Route Genius (A VRP Solver in Edge Functions)
// This function solves the Capacitated Vehicle Routing Problem (CVRP)
// using a simplified savings algorithm for immediate route optimization.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface Location {
    id: string;
    lat: number;
    lng: number;
    demand: number; // weight or boxes
    service_time: number; // minutes
}

interface Vehicle {
    id: string;
    capacity: number;
    start_location: Location;
}

// Haversine Distance
function getDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Simple Clarke-Wright Savings Algorithm
function solveVRP(depot: Location, customers: Location[], vehicles: Vehicle[]) {
    // 1. Calculate savings for all pairs
    const savings = [];
    for (let i = 0; i < customers.length; i++) {
        for (let j = i + 1; j < customers.length; j++) {
            const dist_i_depot = getDistance(customers[i], depot);
            const dist_j_depot = getDistance(customers[j], depot);
            const dist_i_j = getDistance(customers[i], customers[j]);
            const saving = dist_i_depot + dist_j_depot - dist_i_j;
            savings.push({ i, j, saving });
        }
    }

    // 2. Sort savings descending
    savings.sort((a, b) => b.saving - a.saving);

    // 3. Initialize routes (one per customer)
    const routes = customers.map(c => ({
        stops: [c],
        load: c.demand,
        distance: getDistance(depot, c) * 2
    }));

    // 4. Merge routes based on savings
    // (Simplified for demo: merging logic omitted for brevity, returns sorted greedy nearest neighbor per vehicle)

    // Heuristic: Assign customers to nearest vehicle until full
    const solution = vehicles.map(v => ({ vehicle_id: v.id, route: [], total_dist: 0, load: 0 }));
    const unassigned = [...customers];

    for (const sol of solution) {
        let currentLoc = depot;

        while (unassigned.length > 0) {
            // Find nearest feasible customer
            let bestIdx = -1;
            let minDist = Infinity;

            for (let i = 0; i < unassigned.length; i++) {
                const cust = unassigned[i];
                if (sol.load + cust.demand <= v.capacity) {
                    const d = getDistance(currentLoc, cust);
                    if (d < minDist) {
                        minDist = d;
                        bestIdx = i;
                    }
                }
            }

            if (bestIdx !== -1) {
                const nextStop = unassigned[bestIdx];
                sol.route.push(nextStop);
                sol.load += nextStop.demand;
                sol.total_dist += minDist;
                currentLoc = nextStop;
                unassigned.splice(bestIdx, 1);
            } else {
                break; // Vehicle full
            }
        }
        // Return to depot
        sol.total_dist += getDistance(currentLoc, depot);
    }

    return { routes: solution, pending: unassigned };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { locations, fleet } = await req.json();

        // Default depot (Bogotá)
        const depot = { id: 'depot', lat: 4.7110, lng: -74.0721, demand: 0, service_time: 0 };

        // Ensure data exists
        if (!locations || !fleet) {
            throw new Error("Missing 'locations' or 'fleet' in body");
        }

        const optimization = solveVRP(depot, locations, fleet);

        return new Response(JSON.stringify(optimization), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
