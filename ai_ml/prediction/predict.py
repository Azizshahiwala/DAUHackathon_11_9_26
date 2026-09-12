import os
import json
import torch
import numpy as np


from models.solar_autoencoder import SolarAutoencoder


# ============================================================
#                    CONFIGURATION
# ============================================================

MODEL_FILE = "models/solar_autoencoder.pth"

TRAIN_DATA_FILE = "data/train_data.pt"

THRESHOLD_FILE = "data/threshold.txt"


# ============================================================
# SOLAR ASSET CONFIGURATION
# ============================================================

PANEL_CAPACITY_W = 400.0

FORECAST_HOURS = 24

ELECTRICITY_TARIFF_RS_PER_KWH = 8.0

MAX_IRRADIANCE = 1000.0


# ============================================================
# MODEL CONFIGURATION
# ============================================================

FEATURE_COLUMNS = [
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output"
]


# ============================================================
# FALLBACK THRESHOLD
# ============================================================
#
# This is only used if threshold.txt does not exist.
#
# After running:
#
# python -m models.calculate_threshold
#
# the automatically calculated value will be used instead.
# ============================================================

DEFAULT_ANOMALY_THRESHOLD = 1.043583


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def safe_float(value, default=0.0):

    try:
        return float(value)

    except (
        TypeError,
        ValueError
    ):

        return default


# ============================================================
# LOAD TRAINING STATISTICS
# ============================================================

def load_training_statistics():

    if not os.path.exists(
        TRAIN_DATA_FILE
    ):

        raise FileNotFoundError(
            f"Training data file not found: "
            f"{TRAIN_DATA_FILE}"
        )


    training_data = torch.load(
        TRAIN_DATA_FILE,
        weights_only=False
    )


    if "mean" not in training_data:

        raise KeyError(
            "Mean normalization values "
            "not found in train_data.pt"
        )


    if "std" not in training_data:

        raise KeyError(
            "Standard deviation values "
            "not found in train_data.pt"
        )


    mean = training_data["mean"].detach().cpu().numpy().astype(np.float32)

    std = training_data["std"].detach().cpu().numpy().astype(np.float32)


    std[
        std == 0
    ] = 1.0


    return mean, std


# ============================================================
# LOAD ANOMALY THRESHOLD
# ============================================================

def load_anomaly_threshold():

    # --------------------------------------------------------
    # Automatically generated threshold
    # --------------------------------------------------------

    if os.path.exists(
        THRESHOLD_FILE
    ):

        try:

            with open(
                THRESHOLD_FILE,
                "r"
            ) as file:

                value = (
                    file.read()
                    .strip()
                )


            threshold = float(
                value
            )


            if threshold > 0:

                return threshold


        except (
            ValueError,
            OSError
        ):

            pass


    # --------------------------------------------------------
    # Fallback
    # --------------------------------------------------------

    return DEFAULT_ANOMALY_THRESHOLD


# ============================================================
# GLOBAL NORMALIZATION PARAMETERS
# ============================================================

MEAN, STD = (
    load_training_statistics()
)


# ============================================================
# GLOBAL THRESHOLD
# ============================================================

ANOMALY_THRESHOLD = (
    load_anomaly_threshold()
)


# ============================================================
# LOAD PYTORCH MODEL
# ============================================================

def load_model():

    if not os.path.exists(
        MODEL_FILE
    ):

        raise FileNotFoundError(
            f"Trained model not found: "
            f"{MODEL_FILE}"
        )


    model = (
        SolarAutoencoder()
    )


    state_dict = torch.load(
        MODEL_FILE,
        map_location=DEVICE,
        weights_only=True
    )


    model.load_state_dict(
        state_dict
    )


    model = model.to(
        DEVICE
    )


    model.eval()


    return model


# ============================================================
# GLOBAL MODEL
# ============================================================

model = load_model()


# ============================================================
#                       RISK SCORE
# ============================================================

def calculate_risk_score(
    reconstruction_error
):
    """
    Converts reconstruction error into
    a 0-100 application risk score.

    IMPORTANT:
    This is a risk score, NOT a probability.

    It is used to rank assets for maintenance.
    """

    error = safe_float(
        reconstruction_error
    )


    if error <= 0:

        return 0.0


    # --------------------------------------------------------
    # Below threshold
    # --------------------------------------------------------

    if error < ANOMALY_THRESHOLD:

        score = (
            error
            / ANOMALY_THRESHOLD
        ) * 50.0


    # --------------------------------------------------------
    # Above threshold
    # --------------------------------------------------------

    else:

        excess = (
            error
            - ANOMALY_THRESHOLD
        )


        score = (
            50.0
            + excess * 10.0
        )


    score = max(
        0.0,
        min(
            score,
            100.0
        )
    )


    return round(
        score,
        2
    )


# ============================================================
#                       RISK LEVEL
# ============================================================

def get_risk_level(
    risk_score
):

    score = safe_float(
        risk_score
    )


    if score >= 80:

        return "CRITICAL"


    if score >= 60:

        return "HIGH"


    if score >= 30:

        return "MEDIUM"


    return "LOW"


# ============================================================
#                    FAULT DETECTION
# ============================================================

def determine_issue(
    temperature,
    voltage,
    current,
    irradiance,
    soiling,
    power_output
):
    """
    Explainable rule-based fault interpretation.

    The Autoencoder detects that the sensor pattern
    is abnormal.

    These rules provide a human-readable explanation
    of the likely sensor issue.
    """

    temperature = safe_float(
        temperature
    )

    voltage = safe_float(
        voltage
    )

    current = safe_float(
        current
    )

    irradiance = safe_float(
        irradiance
    )

    soiling = safe_float(
        soiling
    )

    power_output = safe_float(
        power_output
    )


    issues = []


    # --------------------------------------------------------
    # OVERHEATING
    # --------------------------------------------------------

    if temperature >= 65:

        issues.append(
            "High temperature / possible overheating"
        )


    # --------------------------------------------------------
    # LOW VOLTAGE
    # --------------------------------------------------------

    if voltage <= 34:

        issues.append(
            "Low voltage / possible electrical degradation"
        )


    # --------------------------------------------------------
    # LOW CURRENT
    # --------------------------------------------------------

    if current <= 5:

        issues.append(
            "Low current / possible generation degradation"
        )


    # --------------------------------------------------------
    # SOILING
    # --------------------------------------------------------

    if soiling >= 30:

        issues.append(
            "Excessive panel soiling"
        )


    # --------------------------------------------------------
    # EXPECTED POWER
    # --------------------------------------------------------

    expected_power = (
        PANEL_CAPACITY_W
        * irradiance
        / MAX_IRRADIANCE
    )


    # --------------------------------------------------------
    # LOW POWER
    # --------------------------------------------------------

    if (
        expected_power > 0
        and
        power_output
        < expected_power * 0.60
    ):

        issues.append(
            "Low power output compared with "
            "available irradiance"
        )


    # --------------------------------------------------------
    # PARTIAL SHADING
    # --------------------------------------------------------

    if (
        irradiance >= 600
        and
        power_output
        < expected_power * 0.50
        and
        soiling < 30
    ):

        issues.append(
            "Possible partial shading or reduced sunlight utilization"
        )


    # --------------------------------------------------------
    # NO SPECIFIC ISSUE
    # --------------------------------------------------------

    if len(issues) == 0:

        issues.append(
            "No major sensor issue detected"
        )


    return issues


# ============================================================
#                     PRIMARY FAULT TYPE
# ============================================================

def determine_fault_type(
    issues,
    temperature,
    voltage,
    current,
    irradiance,
    soiling,
    power_output
):

    """
    Converts the detected issues into one
    primary fault category.
    """

    issue_text = " ".join(
        issues
    ).lower()


    # --------------------------------------------------------
    # COMBINED FAULT
    # --------------------------------------------------------

    fault_indicators = 0


    if temperature >= 65:

        fault_indicators += 1


    if voltage <= 34:

        fault_indicators += 1


    if current <= 5:

        fault_indicators += 1


    if soiling >= 30:

        fault_indicators += 1


    if fault_indicators >= 3:

        return "combined"


    # --------------------------------------------------------
    # OVERHEATING
    # --------------------------------------------------------

    if (
        "overheating"
        in issue_text
    ):

        return "overheating"


    # --------------------------------------------------------
    # SOILING
    # --------------------------------------------------------

    if (
        "soiling"
        in issue_text
    ):

        return "soiling"


    # --------------------------------------------------------
    # LOW VOLTAGE
    # --------------------------------------------------------

    if (
        "low voltage"
        in issue_text
    ):

        return "low_voltage"


    # --------------------------------------------------------
    # LOW CURRENT
    # --------------------------------------------------------

    if (
        "low current"
        in issue_text
    ):

        return "low_current"


    # --------------------------------------------------------
    # PARTIAL SHADING
    # --------------------------------------------------------

    if (
        "partial shading"
        in issue_text
    ):

        return "partial_shading"


    # --------------------------------------------------------
    # POWER DEGRADATION
    # --------------------------------------------------------

    if (
        "low power"
        in issue_text
    ):

        return "power_degradation"


    # --------------------------------------------------------
    # NORMAL
    # --------------------------------------------------------

    return "none"


# ============================================================
#                MAINTENANCE PRIORITY
# ============================================================

def determine_maintenance_priority(
    risk_level
):

    if risk_level == "CRITICAL":

        return "URGENT"


    if risk_level == "HIGH":

        return "HIGH"


    if risk_level == "MEDIUM":

        return "MEDIUM"


    return "ROUTINE"


# ============================================================
#                RECOMMENDED ACTION
# ============================================================

def determine_recommended_action(
    risk_level,
    fault_type="none"
):

    if risk_level == "CRITICAL":

        if fault_type != "none":

            return (
                "Immediately inspect the asset, "
                f"investigate {fault_type.replace('_', ' ')}, "
                "and schedule urgent maintenance."
            )


        return (
            "Immediately inspect the asset "
            "and schedule urgent maintenance."
        )


    if risk_level == "HIGH":

        return (
            "Schedule preventive maintenance soon "
            "and inspect the reported sensor conditions."
        )


    if risk_level == "MEDIUM":

        return (
            "Increase monitoring frequency "
            "and plan a preventive inspection."
        )


    return (
        "Continue routine monitoring. "
        "No immediate maintenance action required."
    )


# ============================================================
#                 ENERGY LOSS ESTIMATION
# ============================================================

def calculate_energy_loss(
    irradiance,
    actual_power
):
    """
    Prototype energy-loss calculation.

    Expected power:
        panel capacity × irradiance ratio

    Energy loss:
        power loss × forecast duration

    This is an engineering prototype estimate.
    Actual deployment should use the site's
    measured capacity, irradiance profile,
    operating hours and tariff.
    """

    irradiance = max(
        0.0,
        safe_float(
            irradiance
        )
    )


    actual_power = max(
        0.0,
        safe_float(
            actual_power
        )
    )


    expected_power = (
        PANEL_CAPACITY_W
        * irradiance
        / MAX_IRRADIANCE
    )


    actual_power = min(
        actual_power,
        PANEL_CAPACITY_W
    )


    power_loss = max(
        expected_power
        - actual_power,
        0.0
    )


    energy_loss_kwh = (
        power_loss
        / 1000.0
        * FORECAST_HOURS
    )


    revenue_loss = (
        energy_loss_kwh
        * ELECTRICITY_TARIFF_RS_PER_KWH
    )


    return (

        round(
            energy_loss_kwh,
            2
        ),

        round(
            revenue_loss,
            2
        )
    )


# ============================================================
#               FAILURE RISK ESTIMATION
# ============================================================

def calculate_failure_risk(
    risk_score,
    risk_level,
    fault_type
):
    """
    Application-level short-term failure risk.

    This should be interpreted as a risk category,
    not as a statistically calibrated probability.

    The current prototype derives it from the
    anomaly/risk system.
    """

    score = safe_float(
        risk_score
    )


    if score >= 80:

        failure_risk = 90


    elif score >= 60:

        failure_risk = 70


    elif score >= 30:

        failure_risk = 40


    else:

        failure_risk = 10


    # --------------------------------------------------------
    # Increase risk for severe faults
    # --------------------------------------------------------

    severe_faults = {

        "combined",
        "overheating",
        "low_voltage"
    }


    if fault_type in severe_faults:

        failure_risk += 5


    failure_risk = min(
        failure_risk,
        99
    )


    return int(
        failure_risk
    )


# ============================================================
#                FAILURE RISK LEVEL
# ============================================================

def get_failure_risk_level(
    failure_risk
):

    value = safe_float(
        failure_risk
    )


    if value >= 80:

        return "VERY_HIGH"


    if value >= 60:

        return "HIGH"


    if value >= 30:

        return "MODERATE"


    return "LOW"


# ============================================================
#                  SENSOR VECTOR
# ============================================================

def create_sensor_vector(
    sensor_data
):

    vector = [

        sensor_data[
            "temperature"
        ],

        sensor_data[
            "voltage"
        ],

        sensor_data[
            "current"
        ],

        sensor_data[
            "irradiance"
        ],

        sensor_data[
            "soiling"
        ],

        sensor_data[
            "power_output"
        ]
    ]


    return np.array(
        vector,
        dtype=np.float32
    )


# ============================================================
#                    NORMALIZATION
# ============================================================

def normalize_sensor_data(
    sensor_vector
):

    sensor_vector = np.asarray(
        sensor_vector,
        dtype=np.float32
    )


    return (
        sensor_vector - MEAN
    ) / STD


# ============================================================
#              SINGLE RECONSTRUCTION ERROR
# ============================================================

def calculate_reconstruction_error(
    normalized_vector
):

    input_tensor = torch.tensor(
        normalized_vector,
        dtype=torch.float32
    ).unsqueeze(0)


    input_tensor = input_tensor.to(
        DEVICE
    )


    with torch.no_grad():

        reconstructed = model(
            input_tensor
        )


    error = torch.mean(
        (
            input_tensor
            - reconstructed
        ) ** 2,
        dim=1
    )


    return float(
        error.cpu().item()
    )


# ============================================================
#                  SINGLE PREDICTION
# ============================================================

def predict_sensor_reading(
    sensor_data
):
    """
    Main function used for predicting
    one solar asset.

    This function is also suitable for
    future Flask integration.

    Example:

        result = predict_sensor_reading({
            "asset_id": "P001",
            "temperature": 35,
            "voltage": 40,
            "current": 8,
            "irradiance": 800,
            "soiling": 5,
            "power_output": 320
        })
    """

    # --------------------------------------------------------
    # Create sensor vector
    # --------------------------------------------------------

    sensor_vector = (
        create_sensor_vector(
            sensor_data
        )
    )


    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    normalized_vector = (
        normalize_sensor_data(
            sensor_vector
        )
    )


    # --------------------------------------------------------
    # Autoencoder
    # --------------------------------------------------------

    reconstruction_error = (
        calculate_reconstruction_error(
            normalized_vector
        )
    )


    # --------------------------------------------------------
    # Anomaly detection
    # --------------------------------------------------------

    is_anomaly = (
        reconstruction_error
        >= ANOMALY_THRESHOLD
    )


    status = (

        "ANOMALY"

        if is_anomaly

        else "NORMAL"
    )


    # --------------------------------------------------------
    # Risk
    # --------------------------------------------------------

    risk_score = (
        calculate_risk_score(
            reconstruction_error
        )
    )


    risk_level = (
        get_risk_level(
            risk_score
        )
    )


    # --------------------------------------------------------
    # Issue detection
    # --------------------------------------------------------

    issues = determine_issue(

        sensor_data[
            "temperature"
        ],

        sensor_data[
            "voltage"
        ],

        sensor_data[
            "current"
        ],

        sensor_data[
            "irradiance"
        ],

        sensor_data[
            "soiling"
        ],

        sensor_data[
            "power_output"
        ]
    )


    # --------------------------------------------------------
    # Fault type
    # --------------------------------------------------------

    fault_type = (
        determine_fault_type(

            issues,

            sensor_data[
                "temperature"
            ],

            sensor_data[
                "voltage"
            ],

            sensor_data[
                "current"
            ],

            sensor_data[
                "irradiance"
            ],

            sensor_data[
                "soiling"
            ],

            sensor_data[
                "power_output"
            ]
        )
    )


    # --------------------------------------------------------
    # Maintenance
    # --------------------------------------------------------

    maintenance_priority = (
        determine_maintenance_priority(
            risk_level
        )
    )


    recommended_action = (
        determine_recommended_action(
            risk_level,
            fault_type
        )
    )


    # --------------------------------------------------------
    # Failure risk
    # --------------------------------------------------------

    failure_risk = (
        calculate_failure_risk(

            risk_score,

            risk_level,

            fault_type
        )
    )


    failure_risk_level = (
        get_failure_risk_level(
            failure_risk
        )
    )


    # --------------------------------------------------------
    # Energy/revenue loss
    # --------------------------------------------------------

    energy_loss, revenue_loss = (
        calculate_energy_loss(

            sensor_data[
                "irradiance"
            ],

            sensor_data[
                "power_output"
            ]
        )
    )


    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {

        "asset_id":
            sensor_data.get(
                "asset_id",
                "UNKNOWN"
            ),

        "status":
            status,

        "reconstruction_error":
            round(
                reconstruction_error,
                6
            ),

        "anomaly_threshold":
            round(
                ANOMALY_THRESHOLD,
                6
            ),

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "failure_risk":
            failure_risk,

        "failure_risk_level":
            failure_risk_level,

        "fault_type":
            fault_type,

        "possible_issues":
            issues,

        "maintenance_priority":
            maintenance_priority,

        "recommended_action":
            recommended_action,

        "estimated_energy_loss_kwh":
            energy_loss,

        "estimated_revenue_loss_rs":
            revenue_loss
    }


# ============================================================
#             CREATE BATCH SENSOR MATRIX
# ============================================================

def create_batch_sensor_matrix(
    assets
):

    vectors = [

        create_sensor_vector(
            asset
        )

        for asset in assets
    ]


    return np.array(
        vectors,
        dtype=np.float32
    )


# ============================================================
#                 BATCH NORMALIZATION
# ============================================================

def normalize_batch(
    sensor_matrix
):

    sensor_matrix = np.asarray(
        sensor_matrix,
        dtype=np.float32
    )


    return (
        sensor_matrix - MEAN
    ) / STD


# ============================================================
#           BATCH RECONSTRUCTION ERRORS
# ============================================================

def calculate_batch_reconstruction_errors(
    normalized_matrix
):

    input_tensor = torch.tensor(
        normalized_matrix,
        dtype=torch.float32
    ).to(
        DEVICE
    )


    with torch.no_grad():

        reconstructed = model(
            input_tensor
        )


        errors = torch.mean(
            (
                input_tensor
                - reconstructed
            ) ** 2,
            dim=1
        )


    return (
        errors
        .cpu()
        .numpy()
    )


# ============================================================
#                 MULTI-ASSET PREDICTION
# ============================================================

def predict_multiple_assets(
    assets
):
    """
    Predict multiple solar assets using
    one PyTorch batch inference operation.

    Example:

        result = predict_multiple_assets(
            [
                asset1,
                asset2,
                asset3
            ]
        )
    """

    if assets is None:

        assets = []


    if len(assets) == 0:

        return {

            "total_assets": 0,

            "normal_assets": 0,

            "anomaly_assets": 0,

            "critical_assets": 0,

            "high_risk_assets": 0,

            "medium_risk_assets": 0,

            "low_risk_assets": 0,

            "total_energy_loss_kwh": 0.0,

            "total_revenue_loss_rs": 0.0,

            "alerts": [],

            "predictions": []
        }


    # --------------------------------------------------------
    # Create matrix
    # --------------------------------------------------------

    sensor_matrix = (
        create_batch_sensor_matrix(
            assets
        )
    )


    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    normalized_matrix = (
        normalize_batch(
            sensor_matrix
        )
    )


    # --------------------------------------------------------
    # PyTorch batch inference
    # --------------------------------------------------------

    reconstruction_errors = (
        calculate_batch_reconstruction_errors(
            normalized_matrix
        )
    )


    predictions = []


    # --------------------------------------------------------
    # Process each asset
    # --------------------------------------------------------

    for index, asset in enumerate(
        assets
    ):

        error = float(
            reconstruction_errors[
                index
            ]
        )


        # ----------------------------------------------------
        # Status
        # ----------------------------------------------------

        status = (

            "ANOMALY"

            if error
            >= ANOMALY_THRESHOLD

            else "NORMAL"
        )


        # ----------------------------------------------------
        # Risk
        # ----------------------------------------------------

        risk_score = (
            calculate_risk_score(
                error
            )
        )


        risk_level = (
            get_risk_level(
                risk_score
            )
        )


        # ----------------------------------------------------
        # Issues
        # ----------------------------------------------------

        issues = determine_issue(

            asset[
                "temperature"
            ],

            asset[
                "voltage"
            ],

            asset[
                "current"
            ],

            asset[
                "irradiance"
            ],

            asset[
                "soiling"
            ],

            asset[
                "power_output"
            ]
        )


        # ----------------------------------------------------
        # Fault
        # ----------------------------------------------------

        fault_type = (
            determine_fault_type(

                issues,

                asset[
                    "temperature"
                ],

                asset[
                    "voltage"
                ],

                asset[
                    "current"
                ],

                asset[
                    "irradiance"
                ],

                asset[
                    "soiling"
                ],

                asset[
                    "power_output"
                ]
            )
        )


        # ----------------------------------------------------
        # Maintenance
        # ----------------------------------------------------

        maintenance_priority = (
            determine_maintenance_priority(
                risk_level
            )
        )


        recommended_action = (
            determine_recommended_action(
                risk_level,
                fault_type
            )
        )


        # ----------------------------------------------------
        # Failure risk
        # ----------------------------------------------------

        failure_risk = (
            calculate_failure_risk(

                risk_score,

                risk_level,

                fault_type
            )
        )


        failure_risk_level = (
            get_failure_risk_level(
                failure_risk
            )
        )


        # ----------------------------------------------------
        # Energy/revenue loss
        # ----------------------------------------------------

        energy_loss, revenue_loss = (
            calculate_energy_loss(

                asset[
                    "irradiance"
                ],

                asset[
                    "power_output"
                ]
            )
        )


        # ----------------------------------------------------
        # Store
        # ----------------------------------------------------

        prediction = {

            "asset_id":
                asset.get(
                    "asset_id",
                    f"P{index + 1:03d}"
                ),

            "status":
                status,

            "reconstruction_error":
                round(
                    error,
                    6
                ),

            "anomaly_threshold":
                round(
                    ANOMALY_THRESHOLD,
                    6
                ),

            "risk_score":
                risk_score,

            "risk_level":
                risk_level,

            "failure_risk":
                failure_risk,

            "failure_risk_level":
                failure_risk_level,

            "fault_type":
                fault_type,

            "possible_issues":
                issues,

            "maintenance_priority":
                maintenance_priority,

            "recommended_action":
                recommended_action,

            "estimated_energy_loss_kwh":
                energy_loss,

            "estimated_revenue_loss_rs":
                revenue_loss
        }


        predictions.append(
            prediction
        )


    # ========================================================
    # SORT BY RISK
    # ========================================================

    predictions.sort(

        key=lambda item:
            item[
                "risk_score"
            ],

        reverse=True
    )


    # ========================================================
    # SUMMARY COUNTS
    # ========================================================

    normal_count = sum(

        item[
            "status"
        ] == "NORMAL"

        for item in predictions
    )


    anomaly_count = sum(

        item[
            "status"
        ] == "ANOMALY"

        for item in predictions
    )


    critical_count = sum(

        item[
            "risk_level"
        ] == "CRITICAL"

        for item in predictions
    )


    high_count = sum(

        item[
            "risk_level"
        ] == "HIGH"

        for item in predictions
    )


    medium_count = sum(

        item[
            "risk_level"
        ] == "MEDIUM"

        for item in predictions
    )


    low_count = sum(

        item[
            "risk_level"
        ] == "LOW"

        for item in predictions
    )


    # ========================================================
    # TOTAL ENERGY LOSS
    # ========================================================

    total_energy_loss = sum(

        item[
            "estimated_energy_loss_kwh"
        ]

        for item in predictions
    )


    # ========================================================
    # TOTAL REVENUE LOSS
    # ========================================================

    total_revenue_loss = sum(

        item[
            "estimated_revenue_loss_rs"
        ]

        for item in predictions
    )


    # ========================================================
    # ALERTS
    # ========================================================

    alerts = [

        item

        for item in predictions

        if item[
            "status"
        ] == "ANOMALY"
    ]


    # ========================================================
    # CRITICAL ALERTS
    # ========================================================

    critical_alerts = [

        item

        for item in predictions

        if item[
            "risk_level"
        ] == "CRITICAL"
    ]


    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {

        "total_assets":
            len(predictions),

        "normal_assets":
            normal_count,

        "anomaly_assets":
            anomaly_count,

        "critical_assets":
            critical_count,

        "high_risk_assets":
            high_count,

        "medium_risk_assets":
            medium_count,

        "low_risk_assets":
            low_count,

        "total_energy_loss_kwh":
            round(
                total_energy_loss,
                2
            ),

        "total_revenue_loss_rs":
            round(
                total_revenue_loss,
                2
            ),

        "alert_count":
            len(alerts),

        "critical_alert_count":
            len(critical_alerts),

        "alerts":
            alerts,

        "predictions":
            predictions
    }


# ============================================================
#                  ASSET RANKING
# ============================================================

def rank_assets(
    predictions
):
    """
    Returns assets sorted from highest
    maintenance risk to lowest.
    """

    return sorted(

        predictions,

        key=lambda item:
            item[
                "risk_score"
            ],

        reverse=True
    )


# ============================================================
#                  TOP ALERTS
# ============================================================

def get_top_alerts(
    result,
    limit=10
):

    alerts = result.get(
        "alerts",
        []
    )


    return alerts[
        :limit
    ]


# ============================================================
#                  RESULT TO JSON
# ============================================================

def result_to_json(
    result
):

    return json.dumps(
        result,
        indent=4
    )


# ============================================================
#                  NORMAL ASSET TEST
# ============================================================

def create_normal_test_asset():

    return {

        "asset_id":
            "P001",

        "temperature":
            35.0,

        "voltage":
            40.0,

        "current":
            8.0,

        "irradiance":
            800.0,

        "soiling":
            5.0,

        "power_output":
            320.0
    }


# ============================================================
#                ABNORMAL ASSET TEST
# ============================================================

def create_abnormal_test_asset():

    return {

        "asset_id":
            "P999",

        "temperature":
            75.0,

        "voltage":
            28.0,

        "current":
            3.0,

        "irradiance":
            900.0,

        "soiling":
            50.0,

        "power_output":
            84.0
    }


# ============================================================
#                  100 ASSET TEST
# ============================================================

def create_test_assets(
    number_of_assets=100
):

    assets = []


    for i in range(
        1,
        number_of_assets + 1
    ):

        # ----------------------------------------------------
        # Every 10th asset is abnormal
        # ----------------------------------------------------

        if i % 10 == 0:

            asset = {

                "asset_id":
                    f"P{i:03d}",

                "temperature":
                    75.0,

                "voltage":
                    28.0,

                "current":
                    3.0,

                "irradiance":
                    900.0,

                "soiling":
                    50.0,

                "power_output":
                    84.0
            }


        else:

            asset = {

                "asset_id":
                    f"P{i:03d}",

                "temperature":
                    35.0,

                "voltage":
                    40.0,

                "current":
                    8.0,

                "irradiance":
                    800.0,

                "soiling":
                    5.0,

                "power_output":
                    320.0
            }


        assets.append(
            asset
        )


    return assets


# ============================================================
#                PRINT SINGLE RESULT
# ============================================================

def print_single_prediction(
    result
):

    print(
        "\n" + "=" * 70
    )

    print(
        "SINGLE ASSET PREDICTION"
    )

    print(
        "=" * 70
    )


    print(
        "\nAsset ID:",
        result[
            "asset_id"
        ]
    )


    print(
        "Status:",
        result[
            "status"
        ]
    )


    print(
        "Reconstruction Error:",
        result[
            "reconstruction_error"
        ]
    )


    print(
        "Anomaly Threshold:",
        result[
            "anomaly_threshold"
        ]
    )


    print(
        "Risk Score:",
        result[
            "risk_score"
        ]
    )


    print(
        "Risk Level:",
        result[
            "risk_level"
        ]
    )


    print(
        "Failure Risk:",
        result[
            "failure_risk"
        ],
        "%"
    )


    print(
        "Failure Risk Level:",
        result[
            "failure_risk_level"
        ]
    )


    print(
        "Fault Type:",
        result[
            "fault_type"
        ]
    )


    print(
        "\nPossible Issues:"
    )


    for issue in result[
        "possible_issues"
    ]:

        print(
            " -",
            issue
        )


    print(
        "\nMaintenance Priority:",
        result[
            "maintenance_priority"
        ]
    )


    print(
        "Recommended Action:",
        result[
            "recommended_action"
        ]
    )


    print(
        "\nEstimated Energy Loss:",
        result[
            "estimated_energy_loss_kwh"
        ],
        "kWh"
    )


    print(
        "Estimated Revenue Loss:",
        result[
            "estimated_revenue_loss_rs"
        ],
        "Rs"
    )


# ============================================================
#                  PRINT BATCH SUMMARY
# ============================================================

def print_batch_summary(
    result
):

    print(
        "\n" + "=" * 70
    )

    print(
        "MULTI-ASSET PREDICTION SUMMARY"
    )

    print(
        "=" * 70
    )


    print(
        "\nTotal assets:",
        result[
            "total_assets"
        ]
    )


    print(
        "Normal assets:",
        result[
            "normal_assets"
        ]
    )


    print(
        "Anomaly assets:",
        result[
            "anomaly_assets"
        ]
    )


    print(
        "Critical assets:",
        result[
            "critical_assets"
        ]
    )


    print(
        "High-risk assets:",
        result[
            "high_risk_assets"
        ]
    )


    print(
        "Medium-risk assets:",
        result[
            "medium_risk_assets"
        ]
    )


    print(
        "Low-risk assets:",
        result[
            "low_risk_assets"
        ]
    )


    print(
        "\nAlert count:",
        result[
            "alert_count"
        ]
    )


    print(
        "Critical alert count:",
        result[
            "critical_alert_count"
        ]
    )


    print(
        "\nTotal estimated energy loss:",
        result[
            "total_energy_loss_kwh"
        ],
        "kWh"
    )


    print(
        "Total estimated revenue loss:",
        result[
            "total_revenue_loss_rs"
        ],
        "Rs"
    )


# ============================================================
#                    PRINT ALERTS
# ============================================================

def print_top_alerts(
    result,
    limit=10
):

    alerts = get_top_alerts(
        result,
        limit
    )


    print(
        "\n" + "=" * 70
    )

    print(
        "TOP MAINTENANCE ALERTS"
    )

    print(
        "=" * 70
    )


    if len(alerts) == 0:

        print(
            "\nNo anomaly alerts."
        )

        return


    for position, alert in enumerate(
        alerts,
        start=1
    ):

        print(
            f"\n{position}. "
            f"{alert['asset_id']}"
        )


        print(
            "   Status:",
            alert[
                "status"
            ]
        )


        print(
            "   Risk Score:",
            alert[
                "risk_score"
            ]
        )


        print(
            "   Risk Level:",
            alert[
                "risk_level"
            ]
        )


        print(
            "   Failure Risk:",
            alert[
                "failure_risk"
            ],
            "%"
        )


        print(
            "   Fault:",
            alert[
                "fault_type"
            ]
        )


        print(
            "   Priority:",
            alert[
                "maintenance_priority"
            ]
        )


# ============================================================
#                 MAIN TEST PROGRAM
# ============================================================

if __name__ == "__main__":

    print(
        "=" * 70
    )

    print(
        "SOLAR AI PREDICTIVE MAINTENANCE"
    )

    print(
        "=" * 70
    )


    print(
        "\nDevice:",
        DEVICE
    )


    print(
        "Model:",
        MODEL_FILE
    )


    print(
        "Anomaly Threshold:",
        ANOMALY_THRESHOLD
    )


    print(
        "Features:",
        FEATURE_COLUMNS
    )


    # ========================================================
    # TEST 1
    # NORMAL ASSET
    # ========================================================

    normal_asset = (
        create_normal_test_asset()
    )


    normal_result = (
        predict_sensor_reading(
            normal_asset
        )
    )


    print_single_prediction(
        normal_result
    )


    # ========================================================
    # TEST 2
    # ABNORMAL ASSET
    # ========================================================

    abnormal_asset = (
        create_abnormal_test_asset()
    )


    abnormal_result = (
        predict_sensor_reading(
            abnormal_asset
        )
    )


    print_single_prediction(
        abnormal_result
    )


    # ========================================================
    # TEST 3
    # 100 ASSETS
    # ========================================================

    assets = (
        create_test_assets(
            100
        )
    )


    batch_result = (
        predict_multiple_assets(
            assets
        )
    )


    print_batch_summary(
        batch_result
    )


    # ========================================================
    # TOP ALERTS
    # ========================================================

    print_top_alerts(
        batch_result,
        limit=10
    )


    # ========================================================
    # JSON PREVIEW
    # ========================================================

    print(
        "\n" + "=" * 70
    )

    print(
        "JSON RESULT PREVIEW"
    )

    print(
        "=" * 70
    )


    json_preview = {

        "total_assets":
            batch_result[
                "total_assets"
            ],

        "normal_assets":
            batch_result[
                "normal_assets"
            ],

        "anomaly_assets":
            batch_result[
                "anomaly_assets"
            ],

        "critical_assets":
            batch_result[
                "critical_assets"
            ],

        "top_alert":
            (
                batch_result[
                    "alerts"
                ][0]

                if len(
                    batch_result[
                        "alerts"
                    ]
                ) > 0

                else None
            )
    }


    print(
        json.dumps(
            json_preview,
            indent=4
        )
    )


    # ========================================================
    # FINAL MESSAGE
    # ========================================================

    print(
        "\n" + "=" * 70
    )

    print(
        "AI PREDICTION SYSTEM TEST COMPLETED"
    )

    print(
        "=" * 70
    )
