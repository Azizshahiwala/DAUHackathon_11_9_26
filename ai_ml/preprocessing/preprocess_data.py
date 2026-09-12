import os
import numpy as np
import pandas as pd
import torch


# ============================================================
# CONFIGURATION
# ============================================================

DATA_FILE = "data/solar_sensor_data.csv"

TRAIN_FILE = "data/train_data.pt"
VALIDATION_FILE = "data/validation_data.pt"
TEST_FILE = "data/test_data.pt"

RANDOM_SEED = 42

TRAIN_RATIO = 0.70
VALIDATION_RATIO = 0.15
TEST_RATIO = 0.15

# Features used by the Autoencoder
FEATURE_COLUMNS = [
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output"
]


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 70)
    print("LOADING SOLAR SENSOR DATA")
    print("=" * 70)

    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(
            f"\nDataset not found:\n{DATA_FILE}\n\n"
            "Make sure solar_sensor_data.csv exists inside the data folder."
        )

    df = pd.read_csv(DATA_FILE)

    print("\nTotal rows:", len(df))

    print("\nColumns:")
    print(df.columns.tolist())

    return df


# ============================================================
# DATA CHECK
# ============================================================

def check_data(df):

    print("\n" + "=" * 70)
    print("DATA CHECK")
    print("=" * 70)

    print("\nMissing values:")
    print(df.isnull().sum())

    print("\nCondition:")
    print(df["condition"].value_counts())

    if "fault_type" in df.columns:

        print("\nFault types:")
        print(df["fault_type"].value_counts())

    # Check required feature columns
    missing_columns = [
        column
        for column in FEATURE_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "\nMissing required feature columns:\n"
            + "\n".join(missing_columns)
        )

    # Check missing feature values
    if df[FEATURE_COLUMNS].isnull().any().any():

        raise ValueError(
            "\nFeature columns contain missing values."
        )


# ============================================================
# SELECT NORMAL DATA
# ============================================================

def select_normal_data(df):

    print("\n" + "=" * 70)
    print("SELECTING NORMAL DATA")
    print("=" * 70)

    normal_df = df[
        df["condition"].astype(str).str.lower() == "normal"
    ].copy()

    print("\nNormal samples:", len(normal_df))

    if len(normal_df) == 0:

        raise ValueError(
            "\nNo normal samples found in the dataset."
        )

    return normal_df


# ============================================================
# EXTRACT FEATURES
# ============================================================

def extract_features(normal_df):

    print("\n" + "=" * 70)
    print("EXTRACTING FEATURES")
    print("=" * 70)

    feature_data = normal_df[
        FEATURE_COLUMNS
    ].to_numpy(
        dtype=np.float32,
        copy=True
    )

    print("\nFeatures used by the model:")

    for feature in FEATURE_COLUMNS:
        print("-", feature)

    print("\nFeature matrix shape:")
    print(feature_data.shape)

    return feature_data


# ============================================================
# SPLIT DATA
# ============================================================

def split_data(data):

    print("\n" + "=" * 70)
    print("SPLITTING DATA")
    print("=" * 70)

    # --------------------------------------------------------
    # IMPORTANT:
    # Make a writable copy before shuffling.
    # This fixes:
    #
    # ValueError: array is read-only
    # --------------------------------------------------------

    data = np.array(
        data,
        dtype=np.float32,
        copy=True
    )

    rng = np.random.default_rng(RANDOM_SEED)

    # Shuffle using a permutation instead of modifying
    # the original array in-place.
    indices = rng.permutation(len(data))

    data = data[indices]

    total_samples = len(data)

    train_end = int(
        total_samples * TRAIN_RATIO
    )

    validation_end = train_end + int(
        total_samples * VALIDATION_RATIO
    )

    train_data = data[
        :train_end
    ].copy()

    validation_data = data[
        train_end:validation_end
    ].copy()

    test_data = data[
        validation_end:
    ].copy()

    print("\nTotal samples:")
    print(total_samples)

    print("\nTraining samples:")
    print(len(train_data))

    print("\nValidation samples:")
    print(len(validation_data))

    print("\nTest samples:")
    print(len(test_data))

    print("\nSplit ratios:")
    print("Training   :", TRAIN_RATIO)
    print("Validation :", VALIDATION_RATIO)
    print("Test       :", TEST_RATIO)

    return (
        train_data,
        validation_data,
        test_data
    )


# ============================================================
# CALCULATE NORMALIZATION
# ============================================================

def calculate_normalization(train_data):

    print("\n" + "=" * 70)
    print("CALCULATING NORMALIZATION VALUES")
    print("=" * 70)

    # --------------------------------------------------------
    # IMPORTANT:
    # Mean and standard deviation are calculated ONLY from
    # training data.
    #
    # This prevents data leakage from validation/test data.
    # --------------------------------------------------------

    mean = train_data.mean(
        axis=0
    )

    std = train_data.std(
        axis=0
    )

    # Prevent division by zero.
    std = np.where(
        std < 1e-8,
        1.0,
        std
    )

    print("\nNormalization Mean:")

    for feature, value in zip(
        FEATURE_COLUMNS,
        mean
    ):
        print(
            f"{feature:15s}: {value:.6f}"
        )

    print("\nNormalization Std:")

    for feature, value in zip(
        FEATURE_COLUMNS,
        std
    ):
        print(
            f"{feature:15s}: {value:.6f}"
        )

    return mean, std


# ============================================================
# NORMALIZE DATA
# ============================================================

def normalize_data(
    data,
    mean,
    std
):

    data = np.asarray(
        data,
        dtype=np.float32
    )

    normalized = (
        data - mean
    ) / std

    return normalized.astype(
        np.float32
    )


# ============================================================
# CONVERT TO PYTORCH TENSOR
# ============================================================

def convert_to_tensor(data):

    tensor = torch.tensor(
        data,
        dtype=torch.float32
    )

    return tensor


# ============================================================
# SAVE DATASET
# ============================================================

def save_dataset(
    data,
    file_path,
    mean,
    std
):

    tensor_data = convert_to_tensor(
        data
    )

    dataset = {

        "data": tensor_data,

        "mean": torch.tensor(
            mean,
            dtype=torch.float32
        ),

        "std": torch.tensor(
            std,
            dtype=torch.float32
        ),

        "features": FEATURE_COLUMNS

    }

    torch.save(
        dataset,
        file_path
    )

    print(
        f"\nSaved: {file_path}"
    )

    print(
        "Shape:",
        tensor_data.shape
    )


# ============================================================
# DISPLAY DATA STATISTICS
# ============================================================

def display_statistics(
    name,
    data
):

    print("\n" + "-" * 70)
    print(name)
    print("-" * 70)

    print(
        "Samples:",
        len(data)
    )

    print(
        "Features:",
        data.shape[1]
    )

    print(
        "Minimum:",
        np.min(data)
    )

    print(
        "Maximum:",
        np.max(data)
    )

    print(
        "Mean:",
        np.mean(data)
    )

    print(
        "Standard deviation:",
        np.std(data)
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("SOLAR SENSOR DATA PREPROCESSING")
    print("=" * 70)

    # --------------------------------------------------------
    # 1. Create data directory
    # --------------------------------------------------------

    os.makedirs(
        "data",
        exist_ok=True
    )

    # --------------------------------------------------------
    # 2. Load dataset
    # --------------------------------------------------------

    df = load_data()

    # --------------------------------------------------------
    # 3. Check dataset
    # --------------------------------------------------------

    check_data(df)

    # --------------------------------------------------------
    # 4. Select only normal data
    #
    # Autoencoder learns the representation of normal
    # operating conditions.
    # --------------------------------------------------------

    normal_df = select_normal_data(
        df
    )

    # --------------------------------------------------------
    # 5. Extract sensor features
    # --------------------------------------------------------

    feature_data = extract_features(
        normal_df
    )

    # --------------------------------------------------------
    # 6. Split into train / validation / test
    # --------------------------------------------------------

    (
        train_data,
        validation_data,
        test_data
    ) = split_data(
        feature_data
    )

    # --------------------------------------------------------
    # 7. Calculate normalization values
    #
    # ONLY training data is used.
    # --------------------------------------------------------

    mean, std = calculate_normalization(
        train_data
    )

    # --------------------------------------------------------
    # 8. Normalize all datasets using training statistics
    # --------------------------------------------------------

    train_normalized = normalize_data(
        train_data,
        mean,
        std
    )

    validation_normalized = normalize_data(
        validation_data,
        mean,
        std
    )

    test_normalized = normalize_data(
        test_data,
        mean,
        std
    )

    # --------------------------------------------------------
    # 9. Display statistics
    # --------------------------------------------------------

    display_statistics(
        "TRAINING DATA",
        train_normalized
    )

    display_statistics(
        "VALIDATION DATA",
        validation_normalized
    )

    display_statistics(
        "TEST DATA",
        test_normalized
    )

    # --------------------------------------------------------
    # 10. Save processed datasets
    # --------------------------------------------------------

    save_dataset(
        train_normalized,
        TRAIN_FILE,
        mean,
        std
    )

    save_dataset(
        validation_normalized,
        VALIDATION_FILE,
        mean,
        std
    )

    save_dataset(
        test_normalized,
        TEST_FILE,
        mean,
        std
    )

    # --------------------------------------------------------
    # 11. Final verification
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("FINAL VERIFICATION")
    print("=" * 70)

    train_tensor = torch.load(
        TRAIN_FILE,
        weights_only=False
    )["data"]

    validation_tensor = torch.load(
        VALIDATION_FILE,
        weights_only=False
    )["data"]

    test_tensor = torch.load(
        TEST_FILE,
        weights_only=False
    )["data"]

    print("\nTraining tensor:")
    print(train_tensor.shape)

    print("\nValidation tensor:")
    print(validation_tensor.shape)

    print("\nTest tensor:")
    print(test_tensor.shape)

    print("\nData type:")
    print(train_tensor.dtype)

    print("\nNumber of features:")
    print(train_tensor.shape[1])

    if train_tensor.shape[1] != 6:

        raise ValueError(
            "\nExpected 6 features but found "
            f"{train_tensor.shape[1]}"
        )

    if len(train_tensor) == 0:

        raise ValueError(
            "\nTraining dataset is empty."
        )

    if len(validation_tensor) == 0:

        raise ValueError(
            "\nValidation dataset is empty."
        )

    if len(test_tensor) == 0:

        raise ValueError(
            "\nTest dataset is empty."
        )

    print("\n" + "=" * 70)
    print("PREPROCESSING COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print("\nFiles created:")

    print("-", TRAIN_FILE)
    print("-", VALIDATION_FILE)
    print("-", TEST_FILE)

    print("\nThe data is ready for PyTorch training.")


# ============================================================
# RUN PROGRAM
# ============================================================

if __name__ == "__main__":
    main()