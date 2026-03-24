import React, { useMemo } from "react";
import { Activity, Leaf, Users } from "lucide-react";
import { MetricRadialChart } from "./MetricRadialChart";
import styles from "./CommandBarMetric.module.css";

type CommandBarMetricProps = {
  metricId: number; // matches ScoreOrbit id (1=Biosphere, 2=Society, else=Economy)
  name: string;
  value: number;
};

function valueToColor(value: number) {
  if (value > 70) return "rgb(34, 197, 94)"; // green
  if (value >= 30) return "rgb(234, 179, 8)"; // yellow
  return "rgb(239, 68, 68)"; // red
}

function MetricIcon({ metricId }: { metricId: number }) {
  if (metricId === 1) return <Leaf size={16} />;
  if (metricId === 2) return <Users size={16} />;
  return <Activity size={16} />;
}

export function CommandBarMetric({ metricId, name, value }: CommandBarMetricProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const progressColor = useMemo(() => valueToColor(safeValue), [safeValue]);

  return (
    <div className={styles.commandItem}>
      <div className={styles.commandTop}>
        <span className={styles.commandIcon} style={{ color: progressColor }}>
          <MetricIcon metricId={metricId} />
        </span>
        <span className={styles.commandLabel}>{name}</span>
      </div>

      <div className={styles.radialWrap}>
        <MetricRadialChart
          value={safeValue}
          progressColor={progressColor}
          showCornerLabels
          showCenterValue
          size={52}
          strokeWidth={6}
        />
      </div>
    </div>
  );
}

