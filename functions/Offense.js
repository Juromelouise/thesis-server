const PlateNumber = require("../model/PlateNumber");
const Offense = require("../model/Offense");

exports.offenseUpdater = async (plateNumberId, status) => {
    try {
      const plateNumber = await PlateNumber.findById(plateNumberId).populate("offense");
  
      if (!plateNumber) {
        throw new Error(`PlateNumber with ID ${plateNumberId} not found.`);
      }
  
      if (status === "Approved") {
        if (!plateNumber.checkOffense) {
          let offense;
  
          // Check if an offense document exists
          if (!plateNumber.offense) {
            // Create a new offense document
            offense = await Offense.create({
              offense: 1,
              fine: 500,
            });
  
            // Update the PlateNumber to reference the new offense document
            await PlateNumber.findByIdAndUpdate(plateNumberId, {
              offense: offense._id,
              checkOffense: true,
            });
  
            console.log(`New offense created and linked: ${offense}`);
          } else {
            // Update the existing offense document
            offense = await Offense.findByIdAndUpdate(
              plateNumber.offense._id,
              {
                $inc: { offense: 1, fine: 500 },
              },
              { new: true }
            );
  
            // Update checkOffense to true
            await PlateNumber.findByIdAndUpdate(plateNumberId, {
              checkOffense: true,
            });
  
            console.log(`Offense updated: ${offense}`);
          }
  
          return true;
        } else {
          console.log("checkOffense is already true. No changes made.");
          return true;
        }
      } else if (status === "Disapproved") {
        const hasApprovedReports = plateNumber.violations.some(
          (violation) => violation.report && violation.report.status === "Approved"
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

exports.offenseResolved = async (plateNumberId) => {
    try {
        
    } catch (error) {
        
    }
}