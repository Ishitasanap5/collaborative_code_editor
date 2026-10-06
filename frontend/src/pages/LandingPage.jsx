import { useNavigate } from "react-router-dom";

function LandingPage() {
    const navigate = useNavigate();

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
        });
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[#090d14] text-white">
            {/* Background atmosphere */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute left-1/2 top-[-250px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/[0.09] blur-[150px]" />
                <div className="absolute bottom-[15%] right-[-250px] h-[500px] w-[500px] rounded-full bg-purple-600/[0.05] blur-[140px]" />

                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#090d14]/75 backdrop-blur-2xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
                    <button
                        type="button"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold shadow-lg shadow-blue-500/20 transition duration-300 group-hover:scale-105 group-hover:shadow-blue-500/30">
                            S
                        </div>

                        <span className="text-lg font-semibold tracking-tight">
                            Syncly<span className="text-blue-400">.</span>
                        </span>
                    </button>

                    <div className="hidden items-center gap-8 md:flex">
                        <button
                            type="button"
                            onClick={() => scrollTo("features")}
                            className="text-sm text-gray-400 transition hover:text-white"
                        >
                            Features
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollTo("how-it-works")}
                            className="text-sm text-gray-400 transition hover:text-white"
                        >
                            How it works
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="group rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium text-gray-200 transition duration-300 hover:border-blue-400/40 hover:bg-blue-400/[0.06]"
                    >
                        Sign in
                        <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                            →
                        </span>
                    </button>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className="relative px-6 pb-20 pt-24 md:pb-28 md:pt-32">
                    <div className="relative mx-auto max-w-5xl text-center">
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/[0.06] px-4 py-2 text-xs font-medium text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                            Real-time collaborative coding
                            <span className="text-blue-400">↗</span>
                        </div>

                        <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl md:text-8xl">
                            Code together.
                            <br />
                            <span className="bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Without the merge chaos.
                            </span>
                        </h1>

                        <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
                            A shared coding workspace where teams can edit the
                            same code, see changes in real time, and keep every
                            important version within reach.
                        </p>

                        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="group rounded-xl bg-blue-500 px-7 py-3.5 font-medium shadow-[0_8px_30px_rgba(59,130,246,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-400 hover:shadow-[0_12px_35px_rgba(59,130,246,0.28)]"
                            >
                                Start coding
                                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                                    →
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => scrollTo("how-it-works")}
                                className="rounded-xl border border-white/10 bg-white/[0.02] px-7 py-3.5 font-medium text-gray-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                            >
                                Explore Syncly
                            </button>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-600">
                            <span>Real-time collaboration</span>
                            <span className="h-1 w-1 rounded-full bg-gray-700" />
                            <span>CRDT synchronization</span>
                            <span className="h-1 w-1 rounded-full bg-gray-700" />
                            <span>Persistent checkpoints</span>
                        </div>
                    </div>
                </section>

                {/* Editor Preview */}
                <section className="mx-auto max-w-6xl px-5 pb-28 sm:px-6">
                    <div className="relative">
                        <div className="absolute -inset-8 rounded-[2rem] bg-blue-600/[0.07] blur-3xl" />

                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141c] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                            <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4 sm:px-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1.5">
                                        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                                        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                                        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                                    </div>

                                    <div className="hidden h-5 w-px bg-white/10 sm:block" />

                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 text-xs font-semibold text-blue-400">
                                            S
                                        </div>

                                        <span className="text-sm font-medium text-gray-300">
                                            Syncly
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-5">
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 sm:text-xs">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                        Connected
                                    </div>

                                    <div className="flex -space-x-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#10141c] bg-blue-600 text-[10px] font-semibold">
                                            I
                                        </div>

                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#10141c] bg-purple-600 text-[10px] font-semibold">
                                            A
                                        </div>

                                        <div className="hidden h-7 w-7 items-center justify-center rounded-full border-2 border-[#10141c] bg-emerald-600 text-[10px] font-semibold sm:flex">
                                            R
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex min-h-[390px] sm:min-h-[430px]">
                                <aside className="hidden w-52 shrink-0 border-r border-white/[0.07] bg-[#0c1017] md:block">
                                    <div className="border-b border-white/[0.07] px-4 py-4">
                                        <div className="text-[9px] font-semibold tracking-[0.2em] text-gray-600">
                                            ROOM
                                        </div>

                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

                                            <span className="text-sm text-gray-300">
                                                CRDT Development
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-3 py-4">
                                        <div className="mb-3 px-2 text-[9px] font-semibold tracking-[0.2em] text-gray-600">
                                            FILES
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
                                                <span className="text-[10px]">
                                                    ◈
                                                </span>
                                                Main.java
                                            </div>

                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500">
                                                <span className="text-[10px]">
                                                    ◈
                                                </span>
                                                App.java
                                            </div>

                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500">
                                                <span className="text-[10px]">
                                                    ◈
                                                </span>
                                                README.md
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/[0.07] px-4 py-4">
                                        <div className="text-[9px] font-semibold tracking-[0.2em] text-gray-600">
                                            COLLABORATORS
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[9px] font-semibold">
                                                    I
                                                </div>

                                                <span className="text-xs text-gray-400">
                                                    Ishita
                                                </span>

                                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[9px] font-semibold">
                                                    A
                                                </div>

                                                <span className="text-xs text-gray-400">
                                                    Alex
                                                </span>

                                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            </div>
                                        </div>
                                    </div>
                                </aside>

                                <div className="min-w-0 flex-1">
                                    <div className="flex h-11 items-center border-b border-white/[0.07] bg-[#0d1118]">
                                        <div className="flex h-full items-center gap-2 border-r border-white/[0.07] bg-[#10141c] px-4 text-sm text-gray-300 sm:px-5">
                                            <span className="text-blue-400">
                                                ◈
                                            </span>
                                            Main.java
                                            <span className="ml-2 text-xs text-gray-600">
                                                ×
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden bg-[#090d13] px-3 py-6 font-mono text-[11px] leading-7 sm:px-5 sm:text-sm md:px-7">
                                        <div className="grid grid-cols-[28px_1fr] sm:grid-cols-[35px_1fr]">
                                            <div className="select-none pr-3 text-right text-gray-700 sm:pr-4">
                                                1<br />
                                                2<br />
                                                3<br />
                                                4<br />
                                                5<br />
                                                6<br />
                                                7<br />
                                                8
                                            </div>

                                            <div className="text-gray-300">
                                                <div>
                                                    <span className="text-purple-400">
                                                        public class
                                                    </span>{" "}
                                                    <span className="text-yellow-300">
                                                        Main
                                                    </span>{" "}
                                                    {"{"}
                                                </div>

                                                <div className="pl-5 sm:pl-6">
                                                    <span className="text-purple-400">
                                                        public static void
                                                    </span>{" "}
                                                    <span className="text-blue-400">
                                                        main
                                                    </span>
                                                    <span className="text-gray-400">
                                                        (String[] args)
                                                    </span>{" "}
                                                    {"{"}
                                                </div>

                                                <div className="pl-10 sm:pl-12">
                                                    System.out.println(
                                                    <span className="text-green-400">
                                                        "Build together."
                                                    </span>
                                                    );
                                                </div>

                                                <div className="pl-10 sm:pl-12">
                                                    System.out.println(
                                                    <span className="text-green-400">
                                                        "Ship faster."
                                                    </span>
                                                    );
                                                </div>

                                                <div className="pl-5 sm:pl-6">
                                                    {"}"}
                                                </div>

                                                <div>{"}"}</div>

                                                <div className="mt-3 flex items-center gap-2 pl-10 sm:pl-12">
                                                    <span className="h-5 w-px animate-pulse bg-purple-400" />

                                                    <span className="rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[9px] text-purple-300">
                                                        Alex
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex h-9 items-center justify-between border-t border-white/[0.07] bg-[#0c1017] px-3 text-[10px] text-gray-600 sm:px-4 sm:text-[11px]">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                Live
                                            </span>

                                            <span>Java</span>
                                            <span className="hidden sm:inline">
                                                UTF-8
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span>Ln 6, Col 5</span>
                                            <span className="hidden sm:inline">
                                                CRLF
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-5 text-center text-xs text-gray-600">
                        One workspace. Multiple collaborators. One shared
                        source of truth.
                    </p>
                </section>

                {/* Features */}
                <section
                    id="features"
                    className="scroll-mt-24 border-y border-white/[0.07] bg-[#0c1119]/80 px-6 py-24 md:py-28"
                >
                    <div className="mx-auto max-w-6xl">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                                Built for collaboration
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">
                                Everything your shared
                                <span className="text-gray-500">
                                    {" "}
                                    workspace needs.
                                </span>
                            </h2>

                            <p className="mt-5 max-w-xl leading-7 text-gray-400">
                                Syncly brings real-time editing, conflict-free
                                synchronization, access control, and
                                recoverable versions into one focused coding
                                environment.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Feature
                                number="01"
                                icon="↔"
                                title="Real-time editing"
                                description="See changes arrive instantly as teammates work in the same document."
                            />

                            <Feature
                                number="02"
                                icon="⌘"
                                title="CRDT powered"
                                description="Concurrent edits converge automatically without relying on a central merge step."
                            />

                            <Feature
                                number="03"
                                icon="◇"
                                title="Rooms & permissions"
                                description="Organize projects into rooms and control who can view or edit them."
                            />

                            <Feature
                                number="04"
                                icon="↺"
                                title="Persistent checkpoints"
                                description="Capture important versions and restore a previous working state when needed."
                            />
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section
                    id="how-it-works"
                    className="scroll-mt-24 px-6 py-24 md:py-32"
                >
                    <div className="mx-auto max-w-6xl">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                                How it works
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl">
                                From idea to shared code.
                            </h2>

                            <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-400">
                                Create a space, bring your collaborators in,
                                and start building together.
                            </p>
                        </div>

                        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
                            <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-gradient-to-r from-blue-500/30 via-indigo-400/20 to-purple-500/30 md:block" />

                            <Step
                                number="01"
                                title="Create a room"
                                description="Set up a workspace for your project and decide who gets access."
                            />

                            <Step
                                number="02"
                                title="Code together"
                                description="Open a document and collaborate through real-time CRDT synchronization."
                            />

                            <Step
                                number="03"
                                title="Keep your progress"
                                description="Save checkpoints so important versions are always recoverable."
                            />
                        </div>
                    </div>
                </section>

                {/* Technology strip */}
                <section className="border-y border-white/[0.07] bg-[#0c1119]/70 px-6 py-16">
                    <div className="mx-auto max-w-5xl">
                        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-600">
                            Built with technologies made for modern
                            collaboration
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            {[
                                "React",
                                "Spring Boot",
                                "WebSockets",
                                "CRDT",
                                "PostgreSQL",
                                "JWT",
                            ].map((tech) => (
                                <div
                                    key={tech}
                                    className="rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-xs text-gray-400 transition duration-300 hover:border-blue-400/20 hover:bg-blue-400/[0.04] hover:text-gray-300"
                                >
                                    {tech}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-6 py-24 md:py-28">
                    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-400/15 bg-gradient-to-br from-blue-600/[0.16] via-[#131a29] to-purple-600/[0.08] px-6 py-16 text-center shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:px-12 sm:py-20">
                        <div className="pointer-events-none absolute left-1/2 top-[-100px] h-64 w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

                        <div className="relative">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 text-lg text-blue-300">
                                S
                            </div>

                            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                                Better work starts with working together.
                            </h2>

                            <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-400">
                                Bring your team into one shared coding
                                environment and turn ideas into working
                                software.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="group mt-8 rounded-xl bg-blue-500 px-7 py-3.5 font-medium shadow-lg shadow-blue-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-400 hover:shadow-blue-500/30"
                            >
                                Start coding
                                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                                    →
                                </span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.07] px-6 py-8">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
                    <button
                        type="button"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        className="group flex items-center gap-2"
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold transition group-hover:bg-blue-400">
                            S
                        </div>

                        <span className="text-sm font-semibold text-gray-300">
                            Syncly<span className="text-blue-400">.</span>
                        </span>
                    </button>

                    <p className="text-center text-xs text-gray-600">
                        Built for developers who build better together.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                        className="text-xs text-gray-500 transition hover:text-gray-300"
                    >
                        Back to top ↑
                    </button>
                </div>
            </footer>
        </div>
    );
}

function Feature({ number, icon, title, description }) {
    return (
        <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-400/25 hover:bg-blue-400/[0.035] hover:shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.07] text-xl text-blue-300 transition duration-300 group-hover:border-blue-400/25 group-hover:bg-blue-400/[0.12]">
                    {icon}
                </div>

                <span className="font-mono text-xs text-gray-700">
                    {number}
                </span>
            </div>

            <h3 className="mt-6 font-semibold text-gray-100">{title}</h3>

            <p className="mt-3 text-sm leading-6 text-gray-500">
                {description}
            </p>
        </div>
    );
}

function Step({ number, title, description }) {
    return (
        <div className="relative text-center md:text-left">
            <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/20 bg-[#0b1018] font-mono text-xs font-semibold text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.08)] md:mx-0">
                {number}
            </div>

            <h3 className="mt-6 text-xl font-semibold text-gray-100">
                {title}
            </h3>

            <p className="mx-auto mt-3 max-w-sm leading-7 text-gray-500 md:mx-0">
                {description}
            </p>
        </div>
    );
}

export default LandingPage;