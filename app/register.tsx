import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerAccount } from "../lib/api/auth";
import { getCampusOptions } from "../lib/api/campus";
import { getHobbyOptions } from "../lib/api/hobbies";
import { getMajorOptions } from "../lib/api/majors";
import { saveAuthSession } from "../lib/auth/session";
import type { SelectOption } from "../lib/api/types";

const steps = [1, 2, 3, 4, 5];
const currentYear = new Date().getFullYear() + 4;
const binusianYearOptions: SelectOption[] = Array.from(
  { length: currentYear - 2010 + 1 },
  (_, index) => {
    const year = 2010 + index;
    return {
      label: `Binusian ${year}`,
      value: String(year),
    };
  },
);

const registerImage = require("../assets/images/register.png");
const MAX_HOBBY_SELECTIONS = 10;
const maxDescriptionWords = 40;

type RegisterErrors = {
  email?: string;
  password?: string;
  whatsapp?: string;
  displayName?: string;
  gender?: string;
  age?: string;
  binusianYear?: string;
  major?: string;
  campus?: string;
  mainPhoto?: string;
  interests?: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Could not register your account. Try again.";
};

type DropdownFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
};

const getPasswordError = (value: string) => {
  if (!value.trim()) {
    return "Please enter your password.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include an uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include a lowercase letter.";
  }

  if (!/\d/.test(value)) {
    return "Password must include a number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include a symbol.";
  }

  return undefined;
};

export default function RegisterScreen() {
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("+62");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [binusianYear, setBinusianYear] = useState("");
  const [major, setMajor] = useState("");
  const [campus, setCampus] = useState("");
  const [mainPhotoUri, setMainPhotoUri] = useState("");
  const [extraPhotoUris, setExtraPhotoUris] = useState(["", "", ""]);
  const [interests, setInterests] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [majorOptions, setMajorOptions] = useState<SelectOption[]>([]);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [hobbyOptions, setHobbyOptions] = useState<SelectOption[]>([]);
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true);
  const [masterDataError, setMasterDataError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  useEffect(() => {
    let isMounted = true;

    async function loadMasterData() {
      try {
        const [majors, campuses, hobbies] = await Promise.all([
          getMajorOptions(),
          getCampusOptions(),
          getHobbyOptions(),
        ]);

        if (!isMounted) return;

        setMajorOptions(majors);
        setCampusOptions(campuses);
        setHobbyOptions(hobbies);
        setMasterDataError("");
      } catch {
        if (!isMounted) return;

        setMasterDataError("Could not load registration options. Try again.");
      } finally {
        if (isMounted) {
          setIsMasterDataLoading(false);
        }
      }
    }

    loadMasterData();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = (field: keyof RegisterErrors) => {
    if (!errors[field]) return;

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const validateAccountStep = () => {
    const nextErrors: RegisterErrors = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      nextErrors.email = "Please enter your Binusian email.";
    } else if (!trimmedEmail.endsWith("@binus.ac.id")) {
      nextErrors.email = "Email must use @binus.ac.id.";
    }

    const passwordError = getPasswordError(password);

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (!whatsapp.trim() || whatsapp.trim() === "+62") {
      nextErrors.whatsapp = "Please enter your WhatsApp number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateProfileStep = () => {
    const nextErrors: RegisterErrors = {};

    if (!displayName.trim()) {
      nextErrors.displayName = "Please enter your display name.";
    }

    if (!gender) {
      nextErrors.gender = "Please choose your gender.";
    }

    const numericAge = Number(age);
    if (!age.trim()) {
      nextErrors.age = "Please enter your age.";
    } else if (
      !Number.isInteger(numericAge) ||
      numericAge < 17 ||
      numericAge > 60
    ) {
      nextErrors.age = "Age must be between 17 and 60.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAboutStep = () => {
    const nextErrors: RegisterErrors = {};

    if (!binusianYear) {
      nextErrors.binusianYear = "Please choose your Binusian year.";
    }

    if (!major) {
      nextErrors.major = "Please choose your major.";
    }

    if (!campus) {
      nextErrors.campus = "Please choose your main campus.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePhotosStep = () => {
    const nextErrors: RegisterErrors = {};

    if (!mainPhotoUri) {
      nextErrors.mainPhoto = "Please upload your main photo.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateVibeStep = () => {
    const nextErrors: RegisterErrors = {};

    if (interests.length === 0) {
      nextErrors.interests = "Please choose at least one interest.";
    }
    if (interests.length > MAX_HOBBY_SELECTIONS) {
      nextErrors.interests = `Please choose up to ${MAX_HOBBY_SELECTIONS} interests.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toggleInterest = (interest: string) => {
    const isSelected = interests.includes(interest);

    if (!isSelected && interests.length >= MAX_HOBBY_SELECTIONS) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        interests: `You can choose up to ${MAX_HOBBY_SELECTIONS} interests.`,
      }));
      return;
    }

    setInterests((currentInterests) =>
      isSelected
        ? currentInterests.filter((item) => item !== interest)
        : [...currentInterests, interest],
    );
    clearError("interests");
  };

  const pickPhoto = async (target: "main" | number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      if (target === "main") {
        setErrors((currentErrors) => ({
          ...currentErrors,
          mainPhoto: "Please allow photo access to upload your main photo.",
        }));
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: target === "main" ? [9, 16] : [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    if (target === "main") {
      setMainPhotoUri(uri);
      clearError("mainPhoto");
      return;
    }

    setExtraPhotoUris((photos) =>
      photos.map((photoUri, photoIndex) =>
        photoIndex === target ? uri : photoUri,
      ),
    );
  };

  const handleNext = () => {
    if (activeStep === 1 && validateAccountStep()) {
      setActiveStep(2);
      setErrors({});
      return;
    }

    if (activeStep === 2 && validateProfileStep()) {
      setActiveStep(3);
      setErrors({});
      return;
    }

    if (activeStep === 3 && validateAboutStep()) {
      setActiveStep(4);
      setErrors({});
      return;
    }

    if (activeStep === 4 && validatePhotosStep()) {
      setActiveStep(5);
      setErrors({});
      return;
    }

    if (activeStep === 5 && validateVibeStep()) {
      setIsConfirmationVisible(true);
      setErrors({});
    }
  };

  const handleConfirmBack = () => {
    if (isSubmitting) return;

    setIsConfirmationVisible(false);
    setActiveStep(5);
  };

  const handleConfirmAccount = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const session = await registerAccount({
        binusianEmail: email.trim().toLowerCase(),
        password,
        phoneNumber: whatsapp.trim(),
        displayName: displayName.trim(),
        gender,
        age: Number(age),
        binusianYear: Number(binusianYear),
        majorId: Number(major),
        campusId: Number(campus),
        hobbyIds: interests.map(Number),
        description: description.trim() || undefined,
        profilePhotoUri: mainPhotoUri,
        photoUris: extraPhotoUris.filter(Boolean),
      });

      await saveAuthSession(session);
      router.replace("/home");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep((step) => step - 1);
      setErrors({});
    }
  };

  const scrollDescriptionIntoView = () => {
    if (activeStep !== 5) return;

    setTimeout(() => {
      scrollViewRef.current?.assureFocusedInputVisible();
    }, 120);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      {isConfirmationVisible ? (
        <ConfirmationStep
          error={submitError}
          isSubmitting={isSubmitting}
          onBack={handleConfirmBack}
          onConfirm={handleConfirmAccount}
        />
      ) : (
        <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
          <View className="flex-1 px-5 pb-5">
            <View className="mt-12 flex-row gap-1">
              {steps.map((step) => (
                <View
                  key={step}
                  className={`h-[3px] flex-1 rounded-full ${
                    step <= activeStep ? "bg-[#211C1D]" : "bg-[#ECECEC]"
                  }`}
                />
              ))}
            </View>

            <KeyboardAwareScrollView
              ref={scrollViewRef}
              className="flex-1"
              bottomOffset={32}
              contentContainerStyle={{
                paddingBottom: 32,
              }}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {activeStep === 1 ? (
                <AccountStep
                  email={email}
                  password={password}
                  whatsapp={whatsapp}
                  errors={errors}
                  clearError={clearError}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  setWhatsapp={setWhatsapp}
                />
              ) : activeStep === 2 ? (
                <ProfileDetailsStep
                  displayName={displayName}
                  gender={gender}
                  age={age}
                  errors={errors}
                  clearError={clearError}
                  setDisplayName={setDisplayName}
                  setGender={setGender}
                  setAge={setAge}
                />
              ) : activeStep === 3 ? (
                <AboutStep
                  binusianYear={binusianYear}
                  major={major}
                  campus={campus}
                  majorOptions={majorOptions}
                  campusOptions={campusOptions}
                  isMasterDataLoading={isMasterDataLoading}
                  masterDataError={masterDataError}
                  errors={errors}
                  clearError={clearError}
                  setBinusianYear={setBinusianYear}
                  setMajor={setMajor}
                  setCampus={setCampus}
                />
              ) : activeStep === 4 ? (
                <PhotosStep
                  mainPhotoUri={mainPhotoUri}
                  extraPhotoUris={extraPhotoUris}
                  error={errors.mainPhoto}
                  onMainPhotoPress={() => pickPhoto("main")}
                  onExtraPhotoPress={(index) => pickPhoto(index)}
                />
              ) : (
                <VibeStep
                  interests={interests}
                  interestOptions={hobbyOptions}
                  maxSelected={MAX_HOBBY_SELECTIONS}
                  description={description}
                  error={errors.interests}
                  isOptionsLoading={isMasterDataLoading}
                  optionsError={masterDataError}
                  onToggleInterest={toggleInterest}
                  onDescriptionChange={(value) =>
                    setDescription(limitWords(value, maxDescriptionWords))
                  }
                  onDescriptionFocus={scrollDescriptionIntoView}
                />
              )}
            </KeyboardAwareScrollView>

            <View className="flex-row items-center justify-between pt-3">
              {activeStep > 1 ? (
                <Pressable
                  className="h-[48px] w-[48px] items-center justify-center rounded-xl border border-[#211C1D] bg-white"
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  onPress={handleBack}
                >
                  <Ionicons name="chevron-back" size={30} color="#211C1D" />
                </Pressable>
              ) : (
                <View className="h-[48px] w-[48px]" />
              )}

              <Pressable
                className="h-[48px] w-[48px] items-center justify-center rounded-xl bg-[#211C1D]"
                accessibilityRole="button"
                accessibilityLabel="Continue"
                onPress={handleNext}
              >
                <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function AccountStep({
  email,
  password,
  whatsapp,
  errors,
  clearError,
  setEmail,
  setPassword,
  setWhatsapp,
}: {
  email: string;
  password: string;
  whatsapp: string;
  errors: RegisterErrors;
  clearError: (field: keyof RegisterErrors) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setWhatsapp: (value: string) => void;
}) {
  return (
    <>
      <View className="mt-9">
        <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          Let&apos;s get you in
        </Text>
        <Text className="mt-2 max-w-[280px] font-jakarta text-[12px] leading-4 text-[#777873]">
          Use your binusian email to start connecting with your campus mates.
        </Text>
      </View>

      <View className="mt-7 gap-4">
        <View>
          <RequiredLabel>Binusian email</RequiredLabel>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError("email");
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="example@binus.ac.id"
            placeholderTextColor="#8D8D8D"
            className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
              errors.email ? "border-[#D71920]" : "border-[#9A9A9A]"
            }`}
          />
          <ErrorMessage message={errors.email} />
        </View>

        <View>
          <RequiredLabel>Password</RequiredLabel>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearError("password");
            }}
            secureTextEntry
            placeholder="Enter your password"
            placeholderTextColor="#8D8D8D"
            className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
              errors.password ? "border-[#D71920]" : "border-[#9A9A9A]"
            }`}
          />
          <ErrorMessage message={errors.password} />
        </View>

        <View>
          <RequiredLabel>WhatsApp number</RequiredLabel>
          <TextInput
            value={whatsapp}
            onChangeText={(value) => {
              setWhatsapp(value);
              clearError("whatsapp");
            }}
            keyboardType="phone-pad"
            placeholder="+62"
            placeholderTextColor="#8D8D8D"
            className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
              errors.whatsapp ? "border-[#D71920]" : "border-[#9A9A9A]"
            }`}
          />
          <ErrorMessage message={errors.whatsapp} />
          <View className="mt-2 flex-row items-center gap-1">
            <Ionicons
              name="information-circle-outline"
              size={12}
              color="#777873"
            />
            <Text className="font-jakarta text-[10px] leading-3 text-[#777873]">
              This is used for contacting potential matches
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

function ConfirmationStep({
  error,
  isSubmitting,
  onBack,
  onConfirm,
}: {
  error: string;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View className="mx-auto w-full max-w-[430px] flex-1 bg-white px-5 pb-8 pt-7">
      <Pressable
        className="h-10 w-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Back"
        disabled={isSubmitting}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={24} color="#171819" />
      </Pressable>

      <View className="mt-8 items-center">
        <Text className="text-center font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          You&apos;re all set!
        </Text>
        <Text className="mt-2 max-w-[260px] text-center font-jakarta text-[13px] leading-2 text-[#777873]">
          Your account is ready. Time to start finding your best matches on
          campus.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Image
          source={registerImage}
          className="h-[300px] w-[300px]"
          resizeMode="contain"
          accessible
          accessibilityLabel="Friends celebrating"
        />
      </View>

      <Pressable
        className={`h-[46px] items-center justify-center rounded-full bg-[#FFDD2D] ${
          isSubmitting ? "opacity-60" : ""
        }`}
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onConfirm}
      >
        <Text className="font-jakarta-bold text-[14px] text-[#171819]">
          {isSubmitting ? "Creating Account..." : "Confirm Account"}
        </Text>
      </Pressable>
      <ErrorMessage message={error} />
    </View>
  );
}

function ProfileDetailsStep({
  displayName,
  gender,
  age,
  errors,
  clearError,
  setDisplayName,
  setGender,
  setAge,
}: {
  displayName: string;
  gender: string;
  age: string;
  errors: RegisterErrors;
  clearError: (field: keyof RegisterErrors) => void;
  setDisplayName: (value: string) => void;
  setGender: (value: string) => void;
  setAge: (value: string) => void;
}) {
  return (
    <>
      <View className="mt-9">
        <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          About You
        </Text>
        <Text className="mt-2 max-w-[280px] font-jakarta text-[12px] leading-4 text-[#777873]">
          Tell us more about yourself!
        </Text>
      </View>

      <View className="mt-7 gap-4">
        <View>
          <RequiredLabel>What should we call you?</RequiredLabel>
          <TextInput
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              clearError("displayName");
            }}
            placeholder="Enter your display name"
            placeholderTextColor="#8D8D8D"
            className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
              errors.displayName ? "border-[#D71920]" : "border-[#9A9A9A]"
            }`}
          />
          <ErrorMessage message={errors.displayName} />
        </View>

        <View>
          <RequiredLabel>Gender</RequiredLabel>
          <View className="flex-row gap-3">
            {["Male", "Female"].map((option) => {
              const isSelected = gender === option;

              return (
                <Pressable
                  key={option}
                  className={`h-[45px] flex-1 items-center justify-center rounded-xl border ${
                    isSelected
                      ? "border-[#211C1D] bg-[#211C1D]"
                      : errors.gender
                        ? "border-[#D71920] bg-white"
                        : "border-[#9A9A9A] bg-white"
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setGender(option);
                    clearError("gender");
                  }}
                >
                  <Text
                    className={`font-jakarta-semibold text-[13px] ${
                      isSelected ? "text-white" : "text-[#171819]"
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ErrorMessage message={errors.gender} />
        </View>

        <View>
          <RequiredLabel>Age</RequiredLabel>
          <TextInput
            value={age}
            onChangeText={(value) => {
              setAge(value.replace(/[^0-9]/g, "").slice(0, 2));
              clearError("age");
            }}
            keyboardType="number-pad"
            placeholder="Enter your age"
            placeholderTextColor="#8D8D8D"
            className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
              errors.age ? "border-[#D71920]" : "border-[#9A9A9A]"
            }`}
          />
          <ErrorMessage message={errors.age} />
        </View>
      </View>
    </>
  );
}

function AboutStep({
  binusianYear,
  major,
  campus,
  majorOptions,
  campusOptions,
  isMasterDataLoading,
  masterDataError,
  errors,
  clearError,
  setBinusianYear,
  setMajor,
  setCampus,
}: {
  binusianYear: string;
  major: string;
  campus: string;
  majorOptions: SelectOption[];
  campusOptions: SelectOption[];
  isMasterDataLoading: boolean;
  masterDataError: string;
  errors: RegisterErrors;
  clearError: (field: keyof RegisterErrors) => void;
  setBinusianYear: (value: string) => void;
  setMajor: (value: string) => void;
  setCampus: (value: string) => void;
}) {
  return (
    <>
      <View className="mt-9">
        <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          Campus Details
        </Text>
        <Text className="mt-2 max-w-[280px] font-jakarta text-[12px] leading-4 text-[#777873]">
          Tell us more about your Binusian profile!
        </Text>
      </View>

      <View className="mt-7 gap-4">
        {masterDataError ? (
          <View className="rounded-xl bg-[#FFF4F4] px-4 py-3">
            <Text className="font-jakarta text-[11px] leading-4 text-[#D71920]">
              {masterDataError}
            </Text>
          </View>
        ) : null}

        <DropdownField
          label="Binusian Year"
          placeholder="Choose your binusian year"
          value={binusianYear}
          options={binusianYearOptions}
          error={errors.binusianYear}
          onSelect={(value) => {
            setBinusianYear(value);
            clearError("binusianYear");
          }}
        />

        <DropdownField
          label="Major"
          placeholder={
            isMasterDataLoading ? "Loading majors..." : "Choose your major"
          }
          value={major}
          options={majorOptions}
          error={errors.major}
          disabled={isMasterDataLoading || majorOptions.length === 0}
          onSelect={(value) => {
            setMajor(value);
            clearError("major");
          }}
        />

        <DropdownField
          label="Main campus location"
          placeholder={
            isMasterDataLoading
              ? "Loading campuses..."
              : "Choose your main campus"
          }
          value={campus}
          options={campusOptions}
          error={errors.campus}
          disabled={isMasterDataLoading || campusOptions.length === 0}
          onSelect={(value) => {
            setCampus(value);
            clearError("campus");
          }}
        />
      </View>
    </>
  );
}

function PhotosStep({
  mainPhotoUri,
  extraPhotoUris,
  error,
  onMainPhotoPress,
  onExtraPhotoPress,
}: {
  mainPhotoUri: string;
  extraPhotoUris: string[];
  error?: string;
  onMainPhotoPress: () => void;
  onExtraPhotoPress: (index: number) => void;
}) {
  return (
    <>
      <View className="mt-9">
        <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          Upload your best shots
        </Text>
        <Text className="mt-2 max-w-[290px] font-jakarta text-[12px] leading-4 text-[#777873]">
          Add your best photos for people to see!
        </Text>
      </View>

      <View className="mt-7">
        <View className="flex-row items-center gap-4">
          <PhotoTile
            uri={mainPhotoUri}
            size="large"
            onPress={onMainPhotoPress}
          />

          <View className="flex-1">
            <RequiredLabel>Upload main photo</RequiredLabel>
            <Text className="font-jakarta text-[12px] leading-4 text-[#777873]">
              This will be the one shown on people&apos;s feeds. You can change
              this later.
            </Text>
            <ErrorMessage message={error} />
          </View>
        </View>

        <View className="mt-7">
          <Text className="font-jakarta-bold text-[14px] text-[#171819]">
            Add more photos{" "}
            <Text className="font-jakarta-semibold text-[12px]">
              (optional)
            </Text>
          </Text>
          <Text className="mt-2 max-w-[340px] font-jakarta text-[12px] leading-4 text-[#777873]">
            You can add more photos for more people to see. You can change these
            later.
          </Text>

          <View className="mt-5 flex-row gap-4">
            {extraPhotoUris.map((uri, index) => (
              <PhotoTile
                key={index}
                uri={uri}
                onPress={() => onExtraPhotoPress(index)}
              />
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

function PhotoTile({
  uri,
  size = "small",
  onPress,
}: {
  uri?: string;
  size?: "small" | "large";
  onPress: () => void;
}) {
  const tileSize =
    size === "large" ? "h-[160px] w-[90px]" : "h-[62px] w-[62px]";

  return (
    <Pressable
      className={`${tileSize} overflow-hidden rounded-xl bg-[#F1F1F1]`}
      accessibilityRole="button"
      accessibilityLabel={uri ? "Change photo" : "Add photo"}
      onPress={onPress}
    >
      {uri ? (
        <View className="relative h-full w-full">
          <Image
            source={{ uri }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60">
            <Ionicons name="pencil" size={13} color="#FFFFFF" />
          </View>
        </View>
      ) : size === "large" ? (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="image-outline" size={25} color="#777873" />
          <Text className="mt-2 font-jakarta text-[10px] text-[#777873]">
            Add image
          </Text>
        </View>
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="add" size={30} color="#777873" />
        </View>
      )}
    </Pressable>
  );
}

function VibeStep({
  interests,
  interestOptions,
  maxSelected,
  description,
  error,
  isOptionsLoading,
  optionsError,
  onToggleInterest,
  onDescriptionChange,
  onDescriptionFocus,
}: {
  interests: string[];
  interestOptions: SelectOption[];
  maxSelected: number;
  description: string;
  error?: string;
  isOptionsLoading: boolean;
  optionsError: string;
  onToggleInterest: (interest: string) => void;
  onDescriptionChange: (value: string) => void;
  onDescriptionFocus: () => void;
}) {
  return (
    <>
      <View className="mt-9">
        <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
          What&apos;s your vibe?
        </Text>
        <Text className="mt-2 max-w-[300px] font-jakarta text-[12px] leading-4 text-[#777873]">
          Tell us more about your interests and hobbies!
        </Text>
      </View>

      <View className="mt-7">
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-4">
            <RequiredLabel>What do you like?</RequiredLabel>
            <Text className="-mt-1 font-jakarta text-[11px] leading-4 text-[#777873]">
              Choose up to {maxSelected} things people should notice
            </Text>
          </View>
          <Text className="font-jakarta-bold text-[12px] text-[#777873]">
            {interests.length}/{maxSelected}
          </Text>
        </View>

        {optionsError ? (
          <View className="mt-4 rounded-xl bg-[#FFF4F4] px-4 py-3">
            <Text className="font-jakarta text-[11px] leading-4 text-[#D71920]">
              {optionsError}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap gap-2">
          {isOptionsLoading ? (
            <Text className="font-jakarta text-[12px] text-[#777873]">
              Loading interests...
            </Text>
          ) : interestOptions.length === 0 ? (
            <Text className="font-jakarta text-[12px] text-[#777873]">
              No interests available.
            </Text>
          ) : (
            interestOptions.map((interest) => {
              const isSelected = interests.includes(interest.value);
              const isOverLimitOption =
                interests.length >= maxSelected && !isSelected;

              return (
                <Pressable
                  key={interest.value}
                  className={`h-[34px] items-center justify-center rounded-full border px-4 ${
                    isSelected
                      ? "border-[#211C1D] bg-[#211C1D]"
                      : "border-[#211C1D] bg-white"
                  } ${isOverLimitOption ? "opacity-45" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onToggleInterest(interest.value)}
                >
                  <Text
                    className={`font-jakarta-semibold text-[12px] ${
                      isSelected ? "text-white" : "text-[#171819]"
                    }`}
                  >
                    {interest.label}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
        <ErrorMessage message={error} />
      </View>

      <View className="mt-7">
        <Text className="mb-2 font-jakarta-bold text-[14px] text-[#171819]">
          Add a description
        </Text>
        <Text className="mb-3 font-jakarta text-[11px] leading-4 text-[#777873]">
          You can give us a simple description of yourself
        </Text>
        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          onFocus={onDescriptionFocus}
          multiline
          blurOnSubmit={false}
          textAlignVertical="top"
          placeholder="Describe yourself..."
          placeholderTextColor="#8D8D8D"
          className="min-h-[132px] rounded-xl border border-[#9A9A9A] px-4 py-3 font-jakarta text-[13px] leading-5 text-[#171819]"
        />
        <Text className="mt-2 text-right font-jakarta text-[11px] text-[#777873]">
          {countWords(description)}/{maxDescriptionWords} words
        </Text>
      </View>
    </>
  );
}

function limitWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return value;

  return words.slice(0, maxWords).join(" ");
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function DropdownField({
  label,
  placeholder,
  value,
  options,
  error,
  disabled = false,
  onSelect,
}: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View>
      <RequiredLabel>{label}</RequiredLabel>
      <Pressable
        className={`h-[45px] flex-row items-center justify-between rounded-xl border px-4 ${
          error ? "border-[#D71920]" : "border-[#9A9A9A]"
        } ${disabled ? "opacity-60" : ""}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`font-jakarta text-[13px] ${
            value ? "text-[#171819]" : "text-[#8D8D8D]"
          }`}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#777873" />
      </Pressable>
      <ErrorMessage message={error} />

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setIsOpen(false)}
        >
          <Pressable className="max-h-[420px] rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 h-1 w-12 self-center rounded-full bg-[#D9D9D9]" />
            <Text className="mb-3 font-jakarta-bold text-[16px] text-[#171819]">
              {label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  className="flex-row items-center justify-between border-b border-[#F0F0F0] py-4"
                  accessibilityRole="button"
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text className="font-jakarta text-[14px] text-[#171819]">
                    {option.label}
                  </Text>
                  {value === option.value ? (
                    <Ionicons name="checkmark" size={20} color="#211C1D" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
      {children}
      <Text className="text-[#D71920]">*</Text>
    </Text>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text className="mt-2 font-jakarta text-[10px] leading-3 text-[#D71920]">
      {message}
    </Text>
  );
}
