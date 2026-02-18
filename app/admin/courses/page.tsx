"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type HoleRow = {
  holeNumber: number;
  par: number;
  yardage: string;
  teeLat: string;
  teeLng: string;
  greenLat: string;
  greenLng: string;
};

function buildEmptyHoles(count: number): HoleRow[] {
  return Array.from({ length: count }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    yardage: "",
    teeLat: "",
    teeLng: "",
    greenLat: "",
    greenLng: "",
  }));
}

/* ------------------------------------------------------------------ */
/*  Hole Data Entry Form                                               */
/* ------------------------------------------------------------------ */
function HoleEntryForm({
  courseId,
  courseName,
  holeCount,
  onClose,
}: {
  courseId: Id<"courses">;
  courseName: string;
  holeCount: number;
  onClose: () => void;
}) {
  const existingHoles = useQuery(api.courses.getCourseHoles, { courseId });
  const addHoles = useMutation(api.courses.addCourseHoles);
  const [submitting, setSubmitting] = useState(false);

  const [holes, setHoles] = useState<HoleRow[]>(() => buildEmptyHoles(holeCount));
  const [initialized, setInitialized] = useState(false);

  // Pre-fill with existing data if available
  if (existingHoles && existingHoles.length > 0 && !initialized) {
    const prefilled: HoleRow[] = Array.from({ length: holeCount }, (_, i) => {
      const existing = existingHoles.find((h) => h.holeNumber === i + 1);
      return existing
        ? {
            holeNumber: existing.holeNumber,
            par: existing.par,
            yardage: String(existing.yardage),
            teeLat: existing.teeLat != null ? String(existing.teeLat) : "",
            teeLng: existing.teeLng != null ? String(existing.teeLng) : "",
            greenLat: existing.greenLat != null ? String(existing.greenLat) : "",
            greenLng: existing.greenLng != null ? String(existing.greenLng) : "",
          }
        : {
            holeNumber: i + 1,
            par: 4,
            yardage: "",
            teeLat: "",
            teeLng: "",
            greenLat: "",
            greenLng: "",
          };
    });
    setHoles(prefilled);
    setInitialized(true);
  }

  function updateHole(index: number, field: keyof HoleRow, value: string | number) {
    setHoles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSave() {
    // Validate all holes have par and yardage
    const incomplete = holes.filter(
      (h) => !h.yardage || parseInt(h.yardage, 10) <= 0
    );
    if (incomplete.length > 0) {
      toast.error(
        `Holes ${incomplete.map((h) => h.holeNumber).join(", ")} are missing yardage`
      );
      return;
    }

    setSubmitting(true);
    try {
      await addHoles({
        courseId,
        holes: holes.map((h) => ({
          holeNumber: h.holeNumber,
          par: h.par,
          yardage: parseInt(h.yardage, 10),
          ...(h.teeLat ? { teeLat: parseFloat(h.teeLat) } : {}),
          ...(h.teeLng ? { teeLng: parseFloat(h.teeLng) } : {}),
          ...(h.greenLat ? { greenLat: parseFloat(h.greenLat) } : {}),
          ...(h.greenLng ? { greenLng: parseFloat(h.greenLng) } : {}),
        })),
      });
      toast.success(`All ${holeCount} holes saved for ${courseName}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save holes");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalYardage = holes.reduce(
    (sum, h) => sum + (parseInt(h.yardage, 10) || 0),
    0
  );

  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-dark-green">
            Hole Data — {courseName}
          </h2>
          <p className="mt-0.5 text-sm text-dark-green/60">
            Enter par and yardage for all {holeCount} holes. GPS coordinates are
            optional.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-sand px-4 py-2 text-xs font-medium text-dark-green/70 transition-colors hover:bg-sand/80"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left">
              <th className="px-2 py-2 font-semibold text-dark-green">Hole</th>
              <th className="px-2 py-2 font-semibold text-dark-green">Par</th>
              <th className="px-2 py-2 font-semibold text-dark-green">Yardage</th>
              <th className="px-2 py-2 font-semibold text-dark-green/60">
                Tee Lat
              </th>
              <th className="px-2 py-2 font-semibold text-dark-green/60">
                Tee Lng
              </th>
              <th className="px-2 py-2 font-semibold text-dark-green/60">
                Green Lat
              </th>
              <th className="px-2 py-2 font-semibold text-dark-green/60">
                Green Lng
              </th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, idx) => (
              <tr
                key={hole.holeNumber}
                className={`border-b border-sand/50 ${
                  idx % 2 === 0 ? "bg-cream/50" : ""
                }`}
              >
                {/* Hole Number */}
                <td className="px-2 py-1.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-dark-green text-xs font-bold text-cream">
                    {hole.holeNumber}
                  </span>
                </td>
                {/* Par */}
                <td className="px-2 py-1.5">
                  <select
                    value={hole.par}
                    onChange={(e) =>
                      updateHole(idx, "par", parseInt(e.target.value, 10))
                    }
                    className="w-16 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
                  >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </td>
                {/* Yardage */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={50}
                    max={700}
                    value={hole.yardage}
                    onChange={(e) => updateHole(idx, "yardage", e.target.value)}
                    placeholder="150"
                    className="w-20 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm text-dark-green placeholder:text-dark-green/30 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
                  />
                </td>
                {/* GPS Fields */}
                {(["teeLat", "teeLng", "greenLat", "greenLng"] as const).map(
                  (field) => (
                    <td key={field} className="px-2 py-1.5">
                      <input
                        type="text"
                        value={hole[field]}
                        onChange={(e) => updateHole(idx, field, e.target.value)}
                        placeholder="—"
                        className="w-24 rounded-lg border border-sand/70 bg-white px-2 py-1.5 text-xs text-dark-green/70 placeholder:text-dark-green/20 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-dark-green/20 font-semibold text-dark-green">
              <td className="px-2 py-2">Total</td>
              <td className="px-2 py-2">{totalPar}</td>
              <td className="px-2 py-2">
                {totalYardage > 0 ? totalYardage.toLocaleString() : "—"}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
        >
          {submitting ? "Saving..." : `Save All ${holeCount} Holes`}
        </button>
        <span className="text-xs text-dark-green/50">
          Total Par: {totalPar} &middot; Total Yardage:{" "}
          {totalYardage > 0 ? totalYardage.toLocaleString() : "—"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Course Form                                                 */
/* ------------------------------------------------------------------ */
function CreateCourseForm({
  onCreated,
}: {
  onCreated: (id: Id<"courses">, name: string, holes: number) => void;
}) {
  const createCourse = useMutation(api.courses.createCourse);

  const [name, setName] = useState("");
  const [par, setPar] = useState("72");
  const [holes, setHoles] = useState("18");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Course name is required";
    if (!par || parseInt(par, 10) < 27 || parseInt(par, 10) > 80)
      newErrors.par = "Enter a valid par (27-80)";
    if (!holes || parseInt(holes, 10) < 1 || parseInt(holes, 10) > 36)
      newErrors.holes = "Enter 1-36 holes";
    if (!location.trim()) newErrors.location = "Location is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const courseId = await createCourse({
        name: name.trim(),
        par: parseInt(par, 10),
        holes: parseInt(holes, 10),
        location: location.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(latitude ? { latitude: parseFloat(latitude) } : {}),
        ...(longitude ? { longitude: parseFloat(longitude) } : {}),
        ...(heroImage.trim() ? { heroImage: heroImage.trim() } : {}),
      });
      toast.success(`Course "${name.trim()}" created`);
      const holeCount = parseInt(holes, 10);
      const courseName = name.trim();
      setName("");
      setPar("72");
      setHoles("18");
      setLocation("");
      setDescription("");
      setLatitude("");
      setLongitude("");
      setHeroImage("");
      onCreated(courseId, courseName, holeCount);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create course"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-dark-green">
        Add New Course
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label
              htmlFor="course-name"
              className="block text-sm font-medium text-dark-green"
            >
              Course Name
            </label>
            <input
              id="course-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Augusta National"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="course-location"
              className="block text-sm font-medium text-dark-green"
            >
              Location
            </label>
            <input
              id="course-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Augusta, GA"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* Par */}
          <div>
            <label
              htmlFor="course-par"
              className="block text-sm font-medium text-dark-green"
            >
              Par
            </label>
            <input
              id="course-par"
              type="number"
              min={27}
              max={80}
              value={par}
              onChange={(e) => setPar(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.par && (
              <p className="mt-1 text-sm text-red-500">{errors.par}</p>
            )}
          </div>

          {/* Holes */}
          <div>
            <label
              htmlFor="course-holes"
              className="block text-sm font-medium text-dark-green"
            >
              Holes
            </label>
            <input
              id="course-holes"
              type="number"
              min={1}
              max={36}
              value={holes}
              onChange={(e) => setHoles(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.holes && (
              <p className="mt-1 text-sm text-red-500">{errors.holes}</p>
            )}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label
              htmlFor="course-desc"
              className="block text-sm font-medium text-dark-green"
            >
              Description{" "}
              <span className="text-dark-green/40">(optional)</span>
            </label>
            <textarea
              id="course-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the course..."
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>

          {/* Latitude */}
          <div>
            <label
              htmlFor="course-lat"
              className="block text-sm font-medium text-dark-green"
            >
              Latitude{" "}
              <span className="text-dark-green/40">(optional)</span>
            </label>
            <input
              id="course-lat"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="33.5032"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>

          {/* Longitude */}
          <div>
            <label
              htmlFor="course-lng"
              className="block text-sm font-medium text-dark-green"
            >
              Longitude{" "}
              <span className="text-dark-green/40">(optional)</span>
            </label>
            <input
              id="course-lng"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-82.0249"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>

          {/* Hero Image URL */}
          <div className="sm:col-span-2">
            <label
              htmlFor="course-hero"
              className="block text-sm font-medium text-dark-green"
            >
              Hero Image URL{" "}
              <span className="text-dark-green/40">(optional)</span>
            </label>
            <input
              id="course-hero"
              type="url"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            <p className="mt-1 text-xs text-dark-green/40">
              Shown as the landing page hero when this course hosts the next event.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
function HeroImageEditor({
  courseId,
  currentUrl,
}: {
  courseId: Id<"courses">;
  currentUrl?: string;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saving, setSaving] = useState(false);
  const updateCourse = useMutation(api.courses.updateCourse);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCourse({ courseId, heroImage: url.trim() || undefined });
      toast.success("Hero image updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-sand/50 pt-3">
      <label className="block text-xs font-medium text-dark-green/60">
        Hero Image URL
      </label>
      <div className="mt-1 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
          className="flex-1 rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-dark-green placeholder:text-dark-green/30 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-augusta px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const courses = useQuery(api.courses.getCoursesWithStats);
  const [editingHeroId, setEditingHeroId] = useState<string | null>(null);
  const [holeEntry, setHoleEntry] = useState<{
    courseId: Id<"courses">;
    courseName: string;
    holeCount: number;
  } | null>(null);

  function handleCourseCreated(
    courseId: Id<"courses">,
    courseName: string,
    holeCount: number
  ) {
    setHoleEntry({ courseId, courseName, holeCount });
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Courses
      </h1>
      <p className="mt-1 text-dark-green/60">
        Manage courses and enter hole-by-hole data for live round tracking.
      </p>

      {/* Create form */}
      <div className="mt-8">
        <CreateCourseForm onCreated={handleCourseCreated} />
      </div>

      {/* Hole entry (shows after course creation or when editing) */}
      {holeEntry && (
        <HoleEntryForm
          key={holeEntry.courseId}
          courseId={holeEntry.courseId}
          courseName={holeEntry.courseName}
          holeCount={holeEntry.holeCount}
          onClose={() => setHoleEntry(null)}
        />
      )}

      {/* Course list */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          All Courses
        </h2>

        {courses === undefined ? (
          <p className="mt-4 text-sm text-dark-green/60">Loading...</p>
        ) : courses.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-dark-green/60">
              No courses yet. Create the first course above.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {courses.map((course) => (
              <div
                key={course._id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-dark-green">
                        {course.name}
                      </h3>
                      {course.holeDataComplete ? (
                        <span className="rounded-full bg-fairway/10 px-2.5 py-0.5 text-xs font-semibold text-fairway">
                          Holes Complete
                        </span>
                      ) : (
                        <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-dark">
                          Holes Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-dark-green/60">
                      {course.location} &middot; Par {course.par} &middot;{" "}
                      {course.holes} holes &middot;{" "}
                      {course.eventCount === 1
                        ? "1 event"
                        : `${course.eventCount} events`}
                    </p>
                    {course.description && (
                      <p className="mt-1 text-xs text-dark-green/40">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setEditingHeroId(
                          editingHeroId === (course._id as string)
                            ? null
                            : (course._id as string)
                        )
                      }
                      className="rounded-full bg-dark-green/10 px-3 py-1.5 text-xs font-medium text-dark-green hover:bg-dark-green/20"
                    >
                      {course.heroImage ? "Edit Image" : "Add Image"}
                    </button>
                    <button
                      onClick={() =>
                        setHoleEntry({
                          courseId: course._id,
                          courseName: course.name,
                          holeCount: course.holes,
                        })
                      }
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        course.holeDataComplete
                          ? "bg-dark-green/10 text-dark-green hover:bg-dark-green/20"
                          : "bg-augusta text-cream hover:bg-deep-green"
                      }`}
                    >
                      {course.holeDataComplete ? "Edit Holes" : "Enter Holes"}
                    </button>
                  </div>
                </div>

                {editingHeroId === (course._id as string) && (
                  <HeroImageEditor
                    courseId={course._id}
                    currentUrl={course.heroImage}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
