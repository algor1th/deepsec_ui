import ResultModel from './ResultModel'
import BatchModel from './BatchModel'
import RunModel from './RunModel'

export default class QueryModel extends ResultModel{
  mapJsonFile (json) {
    // Mandatory fields
    this.status = json.status
    this.atomicData = json.atomic_data.data
    this.semantics = json.semantics
    this.type = json.type
    this.processes = json.processes

    this.batch = null // Not loaded yet
    this.batchFile = json.batch_file

    this.run = null // Not loaded yet
    this.runFile = json.run_file

    // Optional fields
    if (json.start_time) {
      this.startTime = new Date(json.start_time * 1000)
    } else {
      this.startTime = null
    }

    if (json.end_time) {
      this.endTime = new Date(json.end_time * 1000)
    } else {
      this.endTime = null
    }

    if (json.error_msg) {
      this.errorMsg = json.error_msg
    } else {
      this.errorMsg = null
    }

    if (json.attack_trace) {
      this.attackTrace = json.attack_trace
    } else {
      this.attackTrace = null
    }
  }

  loadRelations (json) {
    this.batch = new BatchModel(this.batchFile, false)
    this.run = new RunModel(this.runFile, false)
  }
}
