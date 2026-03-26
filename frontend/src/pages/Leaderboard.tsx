import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Radio, Trophy } from "lucide-react";
import GradientBackground from "../components/shared/GradientBackground";
import styles from "./Leaderboard.module.css";
import gameStyles from "./Game.module.css";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import {
  getLeaderboard,
  LeaderboardResponse,
  leaderboardEntry,
} from "../application/leaderboardService";
import GlobalNav from "../components/shared/GlobalNav";
import AudioControls from "../components/shared/AudioControls";

const Leaderboard = () => {
  const { user, isLoggedIn } = useAuth();

  const [data, setData] = useState<leaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [isloading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"all-time" | "weekly" | "daily">(
    "all-time",
  );
  const { playSound } = useAudio();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const response: LeaderboardResponse = await getLeaderboard({
          limit,
          offset,
          period,
          user_id: isLoggedIn && user ? user.id : -1,
        });

        setData(response.entries);
        setTotal(response.metadata.total_entries);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [offset, limit, isLoggedIn, user, period]);

  const columns: ColumnDef<leaderboardEntry>[] = [
    {
      header: "Rank",
      accessorKey: "rank",
      cell: ({ row }) =>
        row.original.rank === 1 ? (
          <span className={styles.rankWithIcon}>
            <Trophy className={styles.trophyIcon} />
            1
          </span>
        ) : (
          `#${row.original.rank}`
        ),
    },
    {
      header: "Player",
      accessorKey: "username",
    },
    {
      header: "Score",
      accessorKey: "score",
    },
    {
      header: "Achieved",
      accessorKey: "achieved_at",
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
  });

  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  const shell = (children: React.ReactNode) => (
    <div className={gameStyles.container}>
      <GradientBackground idPrefix="leaderboard" />
      <GlobalNav backClassName={gameStyles.backLink} />
      <div
        className={`${gameStyles.content} ${styles.leaderboardContent}`}
      >
        {children}
      </div>
      <AudioControls />
    </div>
  );

  const missionBar = (
    <div className={gameStyles.startMissionBar}>
      <span className={gameStyles.startMissionId}>
        <Radio size={14} aria-hidden />
        Protocol · Global coalition sim
      </span>
      <span className={gameStyles.startSdgPill}>SDG 17</span>
    </div>
  );

  const periodOptions = (
    <div
      className={styles.periodTabs}
      role="tablist"
      aria-label="Leaderboard period"
    >
      <button
        type="button"
        className={`${styles.periodTab} ${period === "all-time" ? styles.activeTab : ""}`}
        onClick={() => {
          playSound("button_click");
          setOffset(0);
          setPeriod("all-time");
        }}
      >
        All time
      </button>

      <button
        type="button"
        className={`${styles.periodTab} ${period === "weekly" ? styles.activeTab : ""}`}
        onClick={() => {
          playSound("button_click");
          setOffset(0);
          setPeriod("weekly");
        }}
      >
        Weekly
      </button>

      <button
        type="button"
        className={`${styles.periodTab} ${period === "daily" ? styles.activeTab : ""}`}
        onClick={() => {
          playSound("button_click");
          setOffset(0);
          setPeriod("daily");
        }}
      >
        Daily
      </button>
    </div>
  )

  if (!isloading && error) {
    return shell(
      <motion.div
        className={`${gameStyles.card} ${gameStyles.startCard}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {missionBar}
        <div className={gameStyles.startHero}>
          <div className={gameStyles.startIconRing} aria-hidden>
            <Trophy size={28} strokeWidth={1.75} />
          </div>
          <h1 className={gameStyles.startTitle}>Couldn&apos;t load ranks</h1>
          <p className={gameStyles.startTagline}>{error}</p>
        </div>
      </motion.div>,
    );
  }

  if (!isloading && !error && data && data.length === 0) {
    return shell(
      <motion.div
        className={`${gameStyles.card} ${gameStyles.startCard}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {missionBar}
        <div className={gameStyles.startHero}>
          <div className={gameStyles.startIconRing} aria-hidden>
            <Trophy size={28} strokeWidth={1.75} />
          </div>
          {periodOptions}
          <h1 className={gameStyles.startTitle}>No scores yet</h1>
          <p className={gameStyles.startTagline}>
            Complete a run to claim the first spot on the board.
          </p>
        </div>
      </motion.div>,
    );
  }

  return shell(
    <motion.div
      className={`${gameStyles.card} ${gameStyles.startCardWide}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {missionBar}

      <div className={gameStyles.startHero}>
        <div className={gameStyles.startIconRing} aria-hidden>
          <Trophy size={28} strokeWidth={1.75} />
        </div>
        <h1 className={gameStyles.startTitle}>Leaderboard</h1>
        <p className={gameStyles.startTagline}>
          Top runs from pilots keeping biosphere, society, and economy in
          balance.
        </p>
      </div>

      {isloading && (
        <p className={gameStyles.startCtaHint}>Loading rankings…</p>
      )}

      {periodOptions}

      {!isloading && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.original.is_user_score ? styles.userRow : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => {
                playSound("button_click");
                setOffset((prev) => Math.max(prev - limit, 0));
              }}
              disabled={!hasPrev}
            >
              Previous
            </button>

            <span>
              Page {Math.floor(offset / limit) + 1} of{" "}
              {Math.max(1, Math.ceil(total / limit))}
            </span>

            <button
              type="button"
              onClick={() => {
                playSound("button_click");
                setOffset((prev) => prev + limit);
              }}
              disabled={!hasNext}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>,
  );
};

export default Leaderboard;
