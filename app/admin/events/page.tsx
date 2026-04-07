"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const FORMATS = [
  { value: "stroke", label: "Stroke Play" },
  { value: "match", label: "Match Play" },
  { value: "bestBall", label: "Best Ball" },
  { value: "scramble", label: "Scramble" },
  { value: "stableford", label: "Stableford" },
  { value: "skins", label: "Skins" },
] as const;

type Format = (typeof FORMATS)[number]["value"];

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-sand text-dark-green/70",
  active: "bg-fairway/10 text-fairway",
  completed: "bg-dark-green/10 text-dark-green",
  canceled: "bg-red-100 text-red-600",
};

const EVENT_STATUSES = ["upcoming", "active", "completed", "canceled"] as const;

function useImageUpload() {
  const generateUploadUrl = useMutation(api.events.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<Id<"_storage"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side preview
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setImageId(storageId as Id<"_storage">);
    } catch {
      toast.error("Failed to upload image");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setPreviewUrl(null);
    setImageId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage() {
    reset();
  }

  return {
    uploading,
    previewUrl,
    imageId,
    fileInputRef,
    handleFileChange,
    reset,
    removeImage,
    setPreviewUrl,
  };
}

function ImageUploadField({
  uploading,
  previewUrl,
  existingImageUrl,
  fileInputRef,
  onFileChange,
  onRemove,
  compact,
}: {
  uploading: boolean;
  previewUrl: string | null;
  existingImageUrl?: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  const displayUrl = previewUrl || existingImageUrl;
  const labelClass = compact
    ? "block text-xs font-medium text-dark-green"
    : "block text-sm font-medium text-dark-green";

  return (
    <div className={compact ? "" : "sm:col-span-2"}>
      <label className={labelClass}>Course Photo</label>
      <div className="mt-1 flex items-center gap-4">
        {displayUrl ? (
          <div className="relative">
            <Image
              src={displayUrl}
              alt="Course preview"
              width={128}
              height={80}
              className="h-20 w-32 rounded-lg object-cover"
              unoptimized={displayUrl.startsWith("blob:")}
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-32 items-center justify-center rounded-lg border-2 border-dashed border-sand text-xs text-dark-green/40 transition-colors hover:border-augusta hover:text-augusta disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        )}
        {displayUrl && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-augusta hover:text-deep-green disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Replace"}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}

function CreateEventForm({
  seasonId,
}: {
  seasonId: Id<"seasons">;
}) {
  const courses = useQuery(api.courses.getAllCourses);
  const createEvent = useMutation(api.events.createEvent);
  const upload = useImageUpload();

  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [format, setFormat] = useState<Format>("stroke");
  const [eventNumber, setEventNumber] = useState("");
  const [isMajor, setIsMajor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Event name is required";
    if (!courseId) newErrors.courseId = "Select a course";
    if (!date) newErrors.date = "Date is required";
    if (!eventNumber || parseInt(eventNumber, 10) < 1 || parseInt(eventNumber, 10) > 8) {
      newErrors.eventNumber = "Enter a number between 1 and 8";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await createEvent({
        seasonId,
        name: name.trim(),
        courseId: courseId as Id<"courses">,
        date,
        format,
        eventNumber: parseInt(eventNumber, 10),
        isMajor,
        imageId: upload.imageId ?? undefined,
      });
      toast.success("Event created");
      setName("");
      setCourseId("");
      setDate("");
      setFormat("stroke");
      setEventNumber("");
      setIsMajor(false);
      upload.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-dark-green">
        Create New Event
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium text-dark-green">
              Event Name
            </label>
            <input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring Championship"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Course */}
          <div>
            <label htmlFor="event-course" className="block text-sm font-medium text-dark-green">
              Course
            </label>
            <select
              id="event-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            >
              <option value="">Select a course...</option>
              {courses?.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name} (Par {course.par})
                </option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-sm text-red-500">{errors.courseId}</p>}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-dark-green">
              Date
            </label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
          </div>

          {/* Format */}
          <div>
            <label htmlFor="event-format" className="block text-sm font-medium text-dark-green">
              Format
            </label>
            <select
              id="event-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Event Number */}
          <div>
            <label htmlFor="event-number" className="block text-sm font-medium text-dark-green">
              Event Number (1-8)
            </label>
            <input
              id="event-number"
              type="number"
              min={1}
              max={8}
              value={eventNumber}
              onChange={(e) => setEventNumber(e.target.value)}
              placeholder="1"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.eventNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.eventNumber}</p>
            )}
          </div>

          {/* Is Major */}
          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-lg border border-sand px-4 py-2.5">
              <input
                type="checkbox"
                checked={isMajor}
                onChange={(e) => setIsMajor(e.target.checked)}
                className="h-4 w-4 rounded border-sand text-augusta focus:ring-augusta"
              />
              <span className="text-sm font-medium text-dark-green">
                Major Championship
              </span>
              <span className="rounded-full bg-azalea/10 px-2 py-0.5 text-xs font-semibold text-azalea">
                2x Points
              </span>
            </label>
          </div>

          {/* Course Photo */}
          <ImageUploadField
            uploading={upload.uploading}
            previewUrl={upload.previewUrl}
            fileInputRef={upload.fileInputRef}
            onFileChange={upload.handleFileChange}
            onRemove={upload.removeImage}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || upload.uploading}
            className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditEventForm({
  event,
  existingImageUrl,
  onClose,
}: {
  event: {
    _id: Id<"events">;
    name: string;
    courseId: Id<"courses">;
    date: string;
    format: Format;
    eventNumber: number;
    isMajor: boolean;
    imageId?: Id<"_storage">;
  };
  existingImageUrl?: string | null;
  onClose: () => void;
}) {
  const courses = useQuery(api.courses.getAllCourses);
  const updateEvent = useMutation(api.events.updateEvent);
  const upload = useImageUpload();

  const [name, setName] = useState(event.name);
  const [courseId, setCourseId] = useState<string>(event.courseId);
  const [date, setDate] = useState(event.date);
  const [format, setFormat] = useState<Format>(event.format);
  const [eventNumber, setEventNumber] = useState(String(event.eventNumber));
  const [isMajor, setIsMajor] = useState(event.isMajor);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateArgs: Parameters<typeof updateEvent>[0] = {
        eventId: event._id,
        name: name.trim(),
        courseId: courseId as Id<"courses">,
        date,
        format,
        eventNumber: parseInt(eventNumber, 10),
        isMajor,
      };

      if (upload.imageId) {
        updateArgs.imageId = upload.imageId;
      }

      await updateEvent(updateArgs);
      toast.success("Event updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-augusta/20 bg-augusta/5 p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-dark-green">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-green">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            >
              {courses?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-green">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-green">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-green">Event #</label>
            <input
              type="number"
              min={1}
              max={8}
              value={eventNumber}
              onChange={(e) => setEventNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isMajor}
                onChange={(e) => setIsMajor(e.target.checked)}
                className="h-4 w-4 rounded border-sand text-augusta focus:ring-augusta"
              />
              <span className="text-sm text-dark-green">Major (2x)</span>
            </label>
          </div>

          {/* Course Photo */}
          <ImageUploadField
            uploading={upload.uploading}
            previewUrl={upload.previewUrl}
            existingImageUrl={existingImageUrl}
            fileInputRef={upload.fileInputRef}
            onFileChange={upload.handleFileChange}
            onRemove={upload.removeImage}
            compact
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting || upload.uploading}
            className="rounded-full bg-augusta px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-sand px-4 py-2 text-xs font-medium text-dark-green/70 transition-colors hover:bg-sand/80"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminEventsPage() {
  const activeSeason = useQuery(api.seasons.getActiveSeason);
  const seasonEvents = useQuery(
    api.events.getSeasonEvents,
    activeSeason ? { seasonId: activeSeason._id } : "skip"
  );
  const updateEvent = useMutation(api.events.updateEvent);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  async function handleStatusChange(
    eventId: Id<"events">,
    status: "upcoming" | "active" | "completed" | "canceled"
  ) {
    try {
      await updateEvent({ eventId, status });
      toast.success(`Event marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const formatLabel = (f: string) =>
    FORMATS.find((fmt) => fmt.value === f)?.label ?? f;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Events
      </h1>
      <p className="mt-1 text-dark-green/60">
        Manage events for the active season.
      </p>

      {/* No active season */}
      {activeSeason === null && (
        <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-dark-green/60">
            No active season. Create and activate a season first.
          </p>
        </div>
      )}

      {/* Create form */}
      {activeSeason && (
        <div className="mt-8">
          <CreateEventForm seasonId={activeSeason._id} />
        </div>
      )}

      {/* Events list */}
      {activeSeason && (
        <div className="mt-8">
          <h2 className="font-serif text-lg font-bold text-dark-green">
            {activeSeason.name} Events
          </h2>

          {seasonEvents === undefined ? (
            <p className="mt-4 text-sm text-dark-green/60">Loading...</p>
          ) : seasonEvents.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-dark-green/60">
                No events yet. Create the first event above.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {seasonEvents.map(({ event, course, imageUrl }) => (
                <div key={event._id} className="rounded-xl bg-white shadow-sm overflow-hidden">
                  {/* Image thumbnail in admin card */}
                  {imageUrl && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={imageUrl}
                        alt={`${event.name} course photo`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 768px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-dark-green/40">
                            #{event.eventNumber}
                          </span>
                          <h3 className="text-lg font-semibold text-dark-green">
                            {event.name}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[event.status]}`}
                          >
                            {event.status}
                          </span>
                          {event.isMajor && (
                            <span className="rounded-full bg-azalea/10 px-2 py-0.5 text-xs font-semibold text-azalea">
                              MAJOR
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-dark-green/60">
                          {course?.name ?? "No course"} &middot;{" "}
                          {new Date(event.date + "T12:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}{" "}
                          &middot; {formatLabel(event.format)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status buttons */}
                        {EVENT_STATUSES.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(event._id, status)
                            }
                            disabled={event.status === status}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                              event.status === status
                                ? "cursor-default bg-augusta text-cream"
                                : "bg-sand text-dark-green/70 hover:bg-dark-green/10"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setEditingEventId(
                              editingEventId === event._id ? null : event._id
                            )
                          }
                          className="rounded-full bg-dark-green/10 px-3 py-1.5 text-xs font-medium text-dark-green transition-colors hover:bg-dark-green/20"
                        >
                          {editingEventId === event._id ? "Close" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingEventId === event._id && (
                      <EditEventForm
                        event={event}
                        existingImageUrl={imageUrl}
                        onClose={() => setEditingEventId(null)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
