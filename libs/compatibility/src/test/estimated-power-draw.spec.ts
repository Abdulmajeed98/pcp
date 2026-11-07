import { type Build, estimatedPowerDrawOf } from '../index';

function cpuOf(tdp: number | undefined): Build['cpu'] {
  return { id: 'the-cpu', specifications: { socket: 'AM5', specifications: { tdp } } };
}

function gpuOf(tdp: number | undefined): Build['gpu'] {
  return { id: 'the-gpu', specifications: { tdp } };
}

describe('the estimated power draw', () => {
  it("adds the CPU's TDP, the GPU's TDP and 100 W for everything else", () => {
    expect(estimatedPowerDrawOf({ cpu: cpuOf(120), gpu: gpuOf(280) })).toEqual({
      known: true,
      watts: 500,
    });
  });

  it('counts 0 W for a Build without a GPU', () => {
    expect(estimatedPowerDrawOf({ cpu: cpuOf(65) })).toEqual({ known: true, watts: 165 });
  });

  it("is not known when the GPU's TDP is missing, naming it", () => {
    expect(estimatedPowerDrawOf({ cpu: cpuOf(120), gpu: gpuOf(undefined) })).toEqual({
      known: false,
      missing: [{ part: 'the-gpu', path: 'tdp' }],
    });
  });

  it("is not known when the CPU's TDP is missing, naming it", () => {
    expect(estimatedPowerDrawOf({ cpu: cpuOf(undefined), gpu: gpuOf(280) })).toEqual({
      known: false,
      missing: [{ part: 'the-cpu', path: 'specifications.tdp' }],
    });
  });

  it('is none for a Build without a CPU', () => {
    expect(estimatedPowerDrawOf({ gpu: gpuOf(280) })).toBeUndefined();
  });
});
