import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, CheckCircle2 } from 'lucide-react';

export interface RecommendationsCardProps {
  recommendations: string[];
  lastBreak: Date | null;
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  lastBreak,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          Recomendaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">{rec}</p>
            </div>
          ))}
        </div>

        {lastBreak && (
          <div className="mt-4 p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">Último descanso</p>
            <p className="text-sm font-medium">
              {new Date(lastBreak).toLocaleString('es-CO')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

RecommendationsCard.displayName = 'RecommendationsCard';

export default React.memo(RecommendationsCard);
