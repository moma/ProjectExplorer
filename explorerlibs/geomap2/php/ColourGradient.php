<?

//localhost/ColorGradient/ColorGradient.php?steps=5


class ColorGenerator {

    public $steps;
    public $thecolors = array();
    public $begin = 0xFF0000;
    public $end = 0xFFFF00;

    public function __construct($nbsteps = "") {
        $this->steps = $nbsteps;
    }

    public function getColours() {
        $theColorBegin = $this->begin;
        $theColorEnd = $this->end;
        $theNumSteps = $this->steps; //255;

        $theColorBegin = (($theColorBegin >= 0x000000) && ($theColorBegin <= 0xffffff)) ? $theColorBegin : 0x000000;
        $theColorEnd = (($theColorEnd >= 0x000000) && ($theColorEnd <= 0xffffff)) ? $theColorEnd : 0xffffff;
        $theNumSteps = (($theNumSteps > 0) && ($theNumSteps < 256)) ? $theNumSteps : 16;

        //printf("<p>values ares: (color begin: 0x%06X), (color end: 0x%06X), (number of steps: %d)</p>\n", $theColorBegin, $theColorEnd, $theNumSteps);

        $theR0 = ($theColorBegin & 0xff0000) >> 16;
        $theG0 = ($theColorBegin & 0x00ff00) >> 8;
        $theB0 = ($theColorBegin & 0x0000ff) >> 0;

        $theR1 = ($theColorEnd & 0xff0000) >> 16;
        $theG1 = ($theColorEnd & 0x00ff00) >> 8;
        $theB1 = ($theColorEnd & 0x0000ff) >> 0;

        // return the interpolated value between pBegin and pEnd
        function interpolate($pBegin, $pEnd, $pStep, $pMax) {
            if ($pBegin < $pEnd) {
                return (($pEnd - $pBegin) * ($pStep / $pMax)) + $pBegin;
            } else {
                return (($pBegin - $pEnd) * (1 - ($pStep / $pMax))) + $pEnd;
            }
        }

        // generate gradient swathe now
        for ($i = 0; $i <= $this->steps; $i++) {
            $theR = interpolate($theR0, $theR1, $i, $theNumSteps);
            $theG = interpolate($theG0, $theG1, $i, $theNumSteps);
            $theB = interpolate($theB0, $theB1, $i, $theNumSteps);

            $theVal = ((($theR << 8) | $theG) << 8) | $theB;

            array_push($this->thecolors, strtoupper(dechex($theVal)));
        }
    }

}
?>

