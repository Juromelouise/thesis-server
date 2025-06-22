const PlateNumber = require("../model/PlateNumber");
const Offense = require("../model/Offense");

exports.offenseUpdater = async (plateNumberId, status) => {
  try {
    const plateNumber = await PlateNumber.findById(plateNumberId).populate("offense");
    const existingOffense = await PlateNumber.findDeleted({ plateNumber: plateNumber.plateNumber }).populate("offense");

    if (!plateNumber) {
      throw new Error(`PlateNumber with ID ${plateNumberId} not found.`);
    }

    if (status === "Approved") {
      if (!plateNumber.checkOffense) {
        let offense;

        const calculateFine = (count) => {
          if (count === 1) return 300;
          if (count === 2) return 500;
          if (count === 3) return 700;
          return 1000; // 4th offense and beyond
        };

        // If there's an existing (soft-deleted) offense, update it
        if (existingOffense && existingOffense.length > 0 && existingOffense[0].offense) {
          const currentCount = existingOffense[0].offense.offense + 1;
          const fine = calculateFine(currentCount);

          offense = await Offense.findByIdAndUpdate(
            existingOffense[0].offense._id,
            {
              $inc: { offense: 1 },
              $set: { fine: fine }
            },
            { new: true }
          );

          await PlateNumber.findByIdAndUpdate(plateNumberId, {
            offense: offense._id,
            checkOffense: true,
          });

          console.log(`Existing offense updated: ${offense}`);
        } else {
          // If no existing offense, create a new one
          if (!plateNumber.offense) {
            const fine = calculateFine(1);

            offense = await Offense.create({
              offense: 1,
              fine: fine,
            });

            await PlateNumber.findByIdAndUpdate(plateNumberId, {
              offense: offense._id,
              checkOffense: true,
            });

            console.log(`New offense created: ${offense}`);
          }
        }

        return true;
      } else {
        console.log("checkOffense is already true. No changes made.");
        return true;
      }
    } else if (status === "Declined") {
      const hasApprovedReports = plateNumber.violations?.some(
        (violation) => violation.report?.status === "Approved"
      );

      if (!hasApprovedReports) {
        await PlateNumber.findByIdAndUpdate(plateNumberId, {
          checkOffense: false,
        });
      }
      return true;
    }
  } catch (error) {
    console.error("Error updating offense:", error.message);
    return error;
  }
};
