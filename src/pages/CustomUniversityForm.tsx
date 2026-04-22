import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import { Info, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { appDb, type CustomUniversityEntry } from "@/storage/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const gradeRowSchema = z.object({
  letter: z.string().trim().min(1, "Grade letter is required"),
  points: z.number().min(0).max(5),
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
});

const admissionSessionRegex = /^(\d{4})\/(\d{4})$/;

const schema = z.object({
  name: z.string().trim().min(2, "University name is required"),
  shortName: z.string().trim().min(2, "Short name is required"),
  location: z.string().trim().min(2, "Location is required"),
  scale: z.union([z.literal(4), z.literal(5)]),
  grades: z.array(gradeRowSchema).min(2, "At least two grade rows are required"),
  repeatPolicy: z.union([z.literal("replace"), z.literal("both")]),
  maxUnitsPerSemester: z.number().min(1).max(40),
  probationCGPA: z.number().min(0).max(5),
  admissionSession: z.string().trim().regex(admissionSessionRegex, "Use format YYYY/YYYY").refine((value) => {
    const match = value.match(admissionSessionRegex);
    if (!match) return false;
    const first = Number(match[1]);
    const second = Number(match[2]);
    return second === first + 1;
  }, "Second year must be first year + 1"),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  name: "",
  shortName: "",
  location: "",
  scale: 5,
  grades: [
    { letter: "A", points: 5, min: 70, max: 100 },
    { letter: "B", points: 4, min: 60, max: 69 },
    { letter: "C", points: 3, min: 50, max: 59 },
    { letter: "D", points: 2, min: 45, max: 49 },
    { letter: "E", points: 1, min: 40, max: 44 },
    { letter: "F", points: 0, min: 0, max: 39 },
  ],
  repeatPolicy: "replace",
  maxUnitsPerSemester: 24,
  probationCGPA: 1,
  admissionSession: "",
};

interface CustomUniversityFormProps {
  onSave?: (entry: CustomUniversityEntry) => void | Promise<void>;
  onCancel?: () => void;
  [key: string]: unknown;
}

export default function CustomUniversityForm({ onSave, onCancel }: CustomUniversityFormProps = {}) {
  const [, setLocation] = useLocation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { register, control, watch, setValue, handleSubmit, formState } = form;
  const { errors } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "grades",
  });

  const scale = watch("scale");
  const repeatPolicy = watch("repeatPolicy");

  const onSubmit = async (values: FormValues) => {
    const now = Date.now();
    const normalizedGrades = values.grades
      .map((grade) => ({
        letter: grade.letter.toUpperCase().trim(),
        points: Number(grade.points),
        min: Number(grade.min),
        max: Number(grade.max),
      }))
      .sort((a, b) => b.points - a.points);

    const maxPoint = Math.max(...normalizedGrades.map((grade) => grade.points));
    if (maxPoint > values.scale) {
      toast.error(`Highest grade point cannot exceed selected ${values.scale}.0 scale.`);
      return;
    }

    const hasInvalidRange = normalizedGrades.some((grade) => grade.max < grade.min);
    if (hasInvalidRange) {
      toast.error("Each grade percentage range must have max greater than or equal to min.");
      return;
    }

    const entry: CustomUniversityEntry = {
      id: `custom-${nanoid(10)}`,
      name: values.name.trim(),
      shortName: values.shortName.trim().toUpperCase(),
      location: values.location.trim(),
      gradingSystem: [{
        session_start: values.admissionSession.trim(),
        session_end: "present",
        scale: values.scale,
        grades: normalizedGrades,
      }],
      repeatPolicy: values.repeatPolicy,
      creditRules: {
        maxUnitsPerSemester: Number(values.maxUnitsPerSemester),
        probationCGPA: Number(values.probationCGPA),
      },
      createdAt: now,
      updatedAt: now,
    };

    await appDb.customUniversities.put(entry);
    toast.success("Custom university profile saved.");
    if (onSave) {
      await onSave(entry);
      return;
    }
    setLocation("/nigerian-universities");
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-border bg-surface-elevated p-6 shadow-md">
          <Button
            variant="ghost"
            className="mb-3"
            onClick={() => {
              if (onCancel) {
                onCancel();
                return;
              }
              setLocation("/nigerian-universities");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to University Selection
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">Custom University Profile</h1>
          <p className="mt-1 text-foreground-muted">Define grading rules that match your school handbook.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-6 shadow-md border-0">
            <h2 className="mb-4 text-lg font-semibold">School Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="name">University Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="shortName">Acronym / Short Name</Label>
                <Input id="shortName" {...register("shortName")} />
                {errors.shortName && <p className="mt-1 text-xs text-red-600">{errors.shortName.message}</p>}
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register("location")} />
                {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
              </div>
              <div>
                <Label htmlFor="admissionSession">Gain of Admission Session</Label>
                <Input id="admissionSession" placeholder="e.g. 2024/2025" {...register("admissionSession")} />
                {errors.admissionSession && <p className="mt-1 text-xs text-red-600">{errors.admissionSession.message}</p>}
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-md border-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Grading System</h2>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className={`text-sm ${scale === 4 ? "font-semibold text-primary" : "text-foreground-subtle"}`}>4.0</span>
                <Switch
                  checked={scale === 5}
                  onCheckedChange={(checked) => setValue("scale", checked ? 5 : 4, { shouldValidate: true })}
                />
                <span className={`text-sm ${scale === 5 ? "font-semibold text-primary" : "text-foreground-subtle"}`}>5.0</span>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border bg-surface-elevated p-3 md:grid-cols-10">
                  <div className="md:col-span-2">
                    <Label>Letter Grade</Label>
                    <Input {...register(`grades.${index}.letter`)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Grade Point</Label>
                    <Input type="number" step="0.01" min={0} max={scale} {...register(`grades.${index}.points`, { valueAsNumber: true })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Min %</Label>
                    <Input type="number" min={0} max={100} {...register(`grades.${index}.min`, { valueAsNumber: true })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Max %</Label>
                    <Input type="number" min={0} max={100} {...register(`grades.${index}.max`, { valueAsNumber: true })} />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <Button type="button" variant="outline" className="w-full" onClick={() => remove(index)} disabled={fields.length <= 2}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ letter: "", points: 0, min: 0, max: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Grade Row
              </Button>
              {errors.grades && <p className="text-xs text-red-600">{errors.grades.message as string}</p>}
            </div>
          </Card>

          <Card className="p-6 shadow-md border-0 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Repeat Policy</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-full text-foreground-subtle hover:text-foreground-muted">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Replace: New grade overwrites old attempt in CGPA. Both: Old and new attempts both count toward total units and points.
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={repeatPolicy}
              onValueChange={(value: "replace" | "both") => setValue("repeatPolicy", value)}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <label className="rounded-lg border p-3 cursor-pointer data-[state=checked]:border-cyan-400">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="replace" id="replace" />
                  <div>
                    <p className="font-medium">Replace</p>
                    <p className="text-xs text-foreground-subtle">New grade overwrites the old one in CGPA.</p>
                  </div>
                </div>
              </label>
              <label className="rounded-lg border p-3 cursor-pointer data-[state=checked]:border-cyan-400">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="both" id="both" />
                  <div>
                    <p className="font-medium">Both</p>
                    <p className="text-xs text-foreground-subtle">Both attempts count toward total units/points.</p>
                  </div>
                </div>
              </label>
            </RadioGroup>
          </Card>

          <Card className="p-6 shadow-md border-0">
            <h2 className="mb-4 text-lg font-semibold">Credit Rules</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="maxUnitsPerSemester">Maximum Units per Semester</Label>
                <Input id="maxUnitsPerSemester" type="number" min={1} max={40} {...register("maxUnitsPerSemester", { valueAsNumber: true })} />
                {errors.maxUnitsPerSemester && (
                  <p className="mt-1 text-xs text-red-600">{errors.maxUnitsPerSemester.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="probationCGPA">Probation CGPA</Label>
                <Input id="probationCGPA" type="number" step="0.01" min={0} max={scale} {...register("probationCGPA", { valueAsNumber: true })} />
                {errors.probationCGPA && (
                  <p className="mt-1 text-xs text-red-600">{errors.probationCGPA.message}</p>
                )}
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="">
              <Save className="mr-2 h-4 w-4" />
              Save Custom Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
