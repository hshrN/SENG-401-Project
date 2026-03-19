import React, { useEffect, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import { Trophy } from "lucide-react";
import GradientBackground from "../components/shared/GradientBackground";
import styles from "./Leaderboard.module.css";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import { getLeaderboard, LeaderboardResponse, leaderboardEntry } from "../application/leaderboardService";
import GlobalNav from "../components/shared/GlobalNav";

const Leaderboard = () => {
  const { user, isLoggedIn } = useAuth();

  const [data, setData] = useState<leaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [isloading, setIsLoading] = useState(false);
  const [error, setError] = useState("")
  const [period, setPeriod] = useState<"all-time" | "weekly" | "daily">("all-time");
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
        // new Date(getValue<string>()).toLocaleDateString(undefined, {
        //   year: "numeric",
        //   month: "short",
        //   day: "numeric",
        // })
        new Date(getValue<string>()).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
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

  if (!isloading && error) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="leaderboard" />
        <GlobalNav backClassName={styles.backLink} />
        <div className={styles.formWrap}>
          <div className={styles.card}>
            <h1 className={styles.title}>Error</h1>
            <p className={styles.subtitle}>Could not load leaderboard</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isloading && !error && data && data.length === 0) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="leaderboard" />
        <GlobalNav backClassName={styles.backLink} />
        <div className={styles.formWrap}>
          <div className={styles.card}>
            <h1 className={styles.title}>Empty</h1>
            <p className={styles.subtitle}>No scores yet</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <GradientBackground idPrefix="leaderboard" />
      <GlobalNav backClassName={styles.backLink} />
        <div className={styles.card}>
          <div className={styles.header}>
            <Trophy className={styles.headerIcon} />
            <h1 className={styles.title}>Leaderboard</h1>
          </div>

          {isloading && <p>Loading...</p>}

          <div className={styles.periodTabs} role="tablist" aria-label="Leaderboard period">
            <button
              type="button"
              className={`${styles.periodTab} ${period === "all-time" ? styles.activeTab : ""}`}
              onClick={() => {
                playSound("button_click");
                setOffset(0);
                setPeriod("all-time");
              }}
            >
              All Time
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
                            header.getContext()
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
                        row.original.is_user_score ? styles.userRow : ""
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <button
                  onClick={() => {playSound("button_click"); setOffset((prev) => Math.max(prev - limit, 0))}}
                  disabled={!hasPrev}
                >
                  Previous
                </button>

                <span>
                  Page {Math.floor(offset / limit) + 1} of{" "}
                  {Math.max(1, Math.ceil(total / limit))}
                </span>

                <button
                  onClick={() => {playSound("button_click"); setOffset((prev) => prev + limit)}}
                  disabled={!hasNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default Leaderboard;